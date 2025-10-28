import base64
import json
import os
import time
from google.cloud import pubsub_v1
from langchain.agents import AgentExecutor, create_react_agent
from langchain_core.prompts import PromptTemplate
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
import logging


PROJECT_ID = "qwiklabs-gcp-00-7a679581466f"

# --- Configuration ---
MANAGER_AGENT_COMMANDS_TOPIC = os.environ.get("MANAGER_AGENT_COMMANDS_TOPIC", "manager-agent-commands")
DATA_INGESTION_TOPIC = os.environ.get("DATA_INGESTION_TOPIC", "data-ingestion-commands")
QUALITY_CHECKER_TOPIC = os.environ.get("QUALITY_CHECKER_TOPIC", "quality-checker-commands")
REPORTING_TOPIC = os.environ.get("REPORTING_TOPIC", "reporting-commands")
ALERTING_TOPIC = os.environ.get("ALERTING_TOPIC", "alerting-commands")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# GLOBAL CLIENTS AND STORAGE
_publisher_client = None
_llm_client = None
_agent_executor_instance = None
_job_status_store = {}  # In-memory store for job statuses

def _get_publisher_client():
    """Initialize and return a Pub/Sub PublisherClient."""
    global _publisher_client
    if _publisher_client is None:
        _publisher_client = pubsub_v1.PublisherClient()
    return _publisher_client

def _get_llm_client():
    """Initialize and return a LangChain Google Generative AI client."""
    global _llm_client
    if _llm_client is None:
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is not set")
        _llm_client = ChatGoogleGenerativeAI(model="gemini-2.5-pro", temperature=0.5, google_api_key=api_key)
    return _llm_client

# Helper functions for in-memory and file-based storage
def _get_job_status(job_id):
    """Retrieve the status of a job from in-memory store or /tmp file.

    Args:
        job_id (str): The unique identifier of the job.

    Returns:
        dict: The job status dictionary, or None if not found.
    """
    # Check in-memory store first
    if job_id in _job_status_store:
        return _job_status_store[job_id]
    
    # Fallback to local file in /tmp
    status_file = f"/tmp/job_status_{job_id}.json"
    try:
        if os.path.exists(status_file):
            with open(status_file, "r") as f:
                status_data = json.load(f)
                _job_status_store[job_id] = status_data  # Cache in memory
                return status_data
    except (OSError, json.JSONDecodeError) as e:
        logger.error(f"Error reading job status from file for {job_id}: {e}")
    return None

def _upload_quality_report(job_id: str, quality_results: dict) -> str:

    REPORT_BUCKET = "gcp31dqreportnomos"
    bucket = storage.Client().bucket(REPORT_BUCKET)
    
    blob_path = f"output.json"

    blob = bucket.blob(blob_path)
    blob.upload_from_string(
        data=json.dumps(quality_results, indent=2),
        content_type="application/json",
    )
    logger.info(f"Uploaded quality report → gs://{REPORT_BUCKET}/{blob_path}")
    return f"gs://{REPORT_BUCKET}/{blob_path}"

def _update_job_status(job_id, status, details=None):
    """Update the status of a job in memory and persist to a /tmp file.

    Args:
        job_id (str): The unique identifier of the job.
        status (str): The new status of the job.
        details (dict, optional): Additional details to store with the status.
    """
    # Update in-memory store
    status_data = {
        "status": status,
        "timestamp": time.time(),
    }
    if details:
        status_data.update(details)
    
    _job_status_store[job_id] = status_data
    logger.info(f"Job {job_id} status updated in memory to: {status}")

    # Persist to local file in /tmp
    status_file = f"/tmp/job_status_{job_id}.json"
    try:
        with open(status_file, "w") as f:
            json.dump(status_data, f)
        logger.info(f"Job {job_id} status persisted to {status_file}")
    except OSError as e:
        logger.error(f"Error writing job status to file for {job_id}: {e}")

# Define the Agent and Tools
def _get_agent_executor():
    """Initialize and return the LangChain AgentExecutor."""
    global _agent_executor_instance
    if _agent_executor_instance is None:
        # Helper function for publishing
        def _publish_message(topic_name, data):
            """Publish a message to a Pub/Sub topic.

            Args:
                topic_name (str): The name of the Pub/Sub topic.
                data (dict): The data to publish as a JSON string.
            """
            try:
                # project_id = os.environ.get("PROJECT_ID", PROJECT_ID)
                project_id="qwiklabs-gcp-00-7a679581466f"
                if not project_id:
                    raise ValueError("PROJECT_ID environment variable is not set")
                topic_path = _get_publisher_client().topic_path(project_id, topic_name)
                future = _get_publisher_client().publish(topic_path, json.dumps(data).encode("utf-8"))
                logger.info(f"Published to {topic_name}: {future.result()}")
            except Exception as e:
                logger.error(f"Error publishing to {topic_name}: {e}")
                raise

        
        # # Define tools with docstrings
        # @tool
        # def trigger_data_ingestion(gcs_uri: str) -> str:
        #     """Trigger data ingestion for a CSV file in Google Cloud Storage.

        #     Args:
        #         gcs_uri (str): The GCS URI of the CSV file to ingest.
                

        #     Returns:
        #         str: A message indicating whether ingestion completed or is awaiting completion.
        #     """
        #     job_id = "test-job-123"
        #     logger.info(f"LangChain Tool: Triggering Data Ingestion for {gcs_uri} (Job ID: {job_id})")
        #     message_data = {
        #         "job_id": job_id,
        #         "gcs_uri": gcs_uri,
        #         "next_step": "run_quality_checks"
        #     }
        #     _publish_message(DATA_INGESTION_TOPIC, message_data)
        #     _update_job_status(job_id, "INGESTION_REQUESTED", {"gcs_uri": gcs_uri})

        #     max_attempts = int(os.environ.get("POLLING_MAX_ATTEMPTS", 30))
        #     sleep_interval = float(os.environ.get("POLLING_INTERVAL_SECONDS", 2))
        #     for attempt in range(max_attempts):
        #         status = _get_job_status(job_id)
        #         if status and status.get("status") == "INGESTION_COMPLETED":
        #             logger.info(f"Ingestion for {job_id} completed successfully.")
        #             return f"Data ingestion for {gcs_uri} successfully initiated and completed. Data reference: {status.get('data_ref')}."
        #         time.sleep(sleep_interval)
        #     return f"Data ingestion for {gcs_uri} initiated, awaiting completion (Job ID: {job_id})."

        @tool
        def analyze_dataset(gcs_uri: str) -> str:
            """
            Analyzes a dataset in GCS and generates a JSON string of applicable data quality checks.

            Args:
                gcs_uri (str): The GCS URI of the dataset (e.g., gs://bucket/file.csv).
                

            Returns:
                str: A JSON string containing the selected data quality checks.
            """

            job_id = "test-job-123"
            gcs_uri ="gs://gcp_31_raw/dummy.csv"
            logger.info(f"LangChain Tool: Analyzing dataset at {gcs_uri} (Job ID: {job_id})")

            try:
                # Simulate dataset analysis (in a real implementation, use pandas or a similar library)
                # Assume access to GCS via google.cloud.storage
                from google.cloud import storage
                import pandas as pd
                import io

                #Extract bucket and file path from gs:// URI
                if not gcs_uri.startswith("gs://"):
                    raise ValueError(f"Invalid GCS URI: {gcs_uri}")
                bucket_name = gcs_uri.split("/")[2]
                file_path = "/".join(gcs_uri.split("/")[3:])
              

                # Download and read a sample of the CSV
                storage_client = storage.Client()
                bucket = storage_client.bucket(bucket_name)
                blob = bucket.blob(file_path)
                data = blob.download_as_bytes()
                df = pd.read_csv(io.BytesIO(data), nrows=100)  # Sample first 100 rows

                # Analyze schema
                columns = df.columns.tolist()
                dtypes = df.dtypes.to_dict()

                # Generate quality checks based on column types
                check_definitions = {
                    "checks": []
                }

                for col in columns:
                    dtype = str(dtypes[col])
                    checks = []

                    # Common checks for all columns
                    checks.append({"type": "not_null", "column": col, "threshold": 0.0})

                    # Type-specific checks
                    if "int" in dtype or "float" in dtype:
                        # Numeric checks: range and outliers
                        min_val = float(df[col].min())
                        max_val = float(df[col].max())
                        checks.append({
                            "type": "range",
                            "column": col,
                            "min": min_val * 0.9,  # Allow 10% below min
                            "max": max_val * 1.1   # Allow 10% above max
                        })
                    elif "object" in dtype:
                        # String checks: length and uniqueness (if likely an ID column)
                        if col.lower() in ["id", "identifier", "unique_id", "key"]:
                            checks.append({"type": "unique", "column": col})
                        checks.append({
                            "type": "length",
                            "column": col,
                            "max_length": int(df[col].str.len().max()) + 10
                        })

                    check_definitions["checks"].extend(checks)

                # Update job status with analysis results
                _update_job_status(job_id, "DATASET_ANALYZED", {"check_definitions": check_definitions})

                return json.dumps(check_definitions)

            except Exception as e:
                logger.error(f"Failed to analyze dataset {gcs_uri} for job {job_id}: {e}")
                _update_job_status(job_id, "DATASET_ANALYSIS_FAILED", {"error": str(e)})
                return f"Failed to analyze dataset: {str(e)}"

        
        
        @tool
        def trigger_quality_checker(data_ref: str) -> str:
            """
            Triggers quality checks for a dataset using dynamically generated check definitions.

            Args:
                data_ref (str): Reference to the processed dataset.

            Returns:
                str: Status message indicating whether quality checks were initiated or completed.
            """
            job_id = "test-job-123"
            
            check_definitions = "[{\"type\": \"not_null\", \"column\": \"id\", \"threshold\": 0.0}, {\"type\": \"range\", \"column\": \"id\", \"min\": 0.9, \"max\": 5.5}, {\"type\": \"not_null\", \"column\": \"name\", \"threshold\": 0.0}, {\"type\": \"length\", \"column\": \"name\", \"max_length\": 17}, {\"type\": \"not_null\", \"column\": \"age\", \"threshold\": 0.0}, {\"type\": \"range\", \"column\": \"age\", \"min\": 21.6, \"max\": 46.2}, {\"type\": \"not_null\", \"column\": \"city\", \"threshold\": 0.0}, {\"type\": \"length\", \"column\": \"city\", \"max_length\": 21}]"            
            logger.info(f"LangChain Tool: Triggering Quality Checker for {data_ref} (Job ID: {job_id})")
            logger.debug(f"Received check_definitions: {check_definitions}")
            try:
                # Validate check_definitions
                json.loads(check_definitions)  # Ensure it's valid JSON
                message_data = {
                    "job_id": job_id,
                    "data_ref": data_ref,
                    "check_definitions": check_definitions,
                    "next_step": "process_quality_results"
                }
                _publish_message(QUALITY_CHECKER_TOPIC, message_data)
                _update_job_status(job_id, "QUALITY_CHECK_REQUESTED", {"data_ref": data_ref, "check_definitions": check_definitions})

                max_attempts = int(os.environ.get("POLLING_MAX_ATTEMPTS", 30))
                sleep_interval = float(os.environ.get("POLLING_INTERVAL_SECONDS", 2))
                for attempt in range(max_attempts):
                    status = _get_job_status(job_id)
                    if status and status.get("status") == "QUALITY_CHECKS_COMPLETED":
                        logger.info(f"Quality checks for {job_id} completed successfully.")
                        quality_results = status.get("quality_results")
                        if not quality_results:
                             logger.warning(f"QUALITY_CHECKS_COMPLETED but no results for {job_id}")
                             return "Quality checks completed but results missing."

                        logger.info(f"Quality checks completed for {job_id}. Returning results.")
                        return json.dumps(quality_results)  
                        # return f"Quality checks for {data_ref} completed. Results: {json.dumps(status.get('quality_results'), indent=2)}"
                    time.sleep(sleep_interval)
                return f"Quality checks for {data_ref} initiated, awaiting completion (Job ID: {job_id})."

            except json.JSONDecodeError as e:
                logger.error(f"Invalid check_definitions JSON for job {job_id}: {e}")
                return f"Failed to parse check_definitions for job {job_id}: {str(e)}"
            except Exception as e:
                logger.error(f"Error triggering quality checker for job {job_id}: {e}")
                return f"Error triggering quality checks for {data_ref}: {str(e)}"
        @tool
        def trigger_reporting_agent(job_id: str, quality_results: str) -> str:
            """Trigger reporting based on quality check results.

            Args:
                job_id (str): The unique identifier for the job.
                quality_results (str): JSON string containing quality check results.

            Returns:
                str: A message indicating whether reporting completed or is awaiting completion.
            """
            logger.info(f"LangChain Tool: Triggering Reporting Agent for Job ID: {job_id}")
            
            try:
                message_data = {
                    "job_id": job_id,
                    "quality_results": json.loads(quality_results),
                    "next_step": "job_complete"
                }
            except json.JSONDecodeError as e:
                logger.error(f"Invalid quality_results JSON for job {job_id}: {e}")
                return f"Failed to parse quality_results for job {job_id}: {str(e)}"
            _publish_message(REPORTING_TOPIC, message_data)
            _update_job_status(job_id, "REPORTING_REQUESTED")

            max_attempts = int(os.environ.get("POLLING_MAX_ATTEMPTS", 30))
            sleep_interval = float(os.environ.get("POLLING_INTERVAL_SECONDS", 2))
            for attempt in range(max_attempts):
                status = _get_job_status(job_id)
                if status and status.get("status") == "REPORTING_COMPLETED":
                    logging.info(f"Uploading quality results to bucket")
                    _upload_quality_report(job_id,quality_results)
                    logging.info(f"Uploading quality results to bucket completed")
                    logger.info(f"Reporting for {job_id} completed successfully.")
                    return f"Reporting for job {job_id} completed. Report URL: {status.get('report_url')}."
                    
                time.sleep(sleep_interval)
            return f"Reporting for job {job_id} initiated, awaiting completion."

        # @tool
        # def trigger_alerting_agent(job_id: str, alert_type: str, details: str, target_users: list) -> str:
        #     """Trigger an alert based on job status or quality results.

        #     Args:
        #         job_id (str): The unique identifier for the job.
        #         alert_type (str): Type of alert (e.g., 'critical_data_quality_failure', 'data_quality_summary').
        #         details (str): JSON string containing alert details.
        #         target_users (list): List of user emails to receive the alert.

        #     Returns:
        #         str: A message indicating whether alerting completed or is awaiting completion.
        #     """
        #     logger.info(f"LangChain Tool: Triggering Alerting Agent for Job ID: {job_id}, Type: {alert_type}")
        #     try:
        #         message_data = {
        #             "job_id": job_id,
        #             "alert_type": alert_type,
        #             "details": json.loads(details),
        #             "target_users": target_users
        #         }
        #     except json.JSONDecodeError as e:
        #         logger.error(f"Invalid details JSON for job {job_id}: {e}")
        #         return f"Failed to parse details for job {job_id} ({alert_type}): {str(e)}"
        #     _publish_message(ALERTING_TOPIC, message_data)
        #     _update_job_status(job_id, f"ALERTING_REQUESTED_{alert_type}")

        #     max_attempts = int(os.environ.get("POLLING_MAX_ATTEMPTS", 30))
        #     sleep_interval = float(os.environ.get("POLLING_INTERVAL_SECONDS", 2))
        #     for attempt in range(max_attempts):
        #         status = _get_job_status(job_id)
        #         if status and status.get("status") == "ALERTING_COMPLETED" and status.get('details', {}).get('alert_type') == alert_type:
        #             logger.info(f"Alerting for {job_id} ({alert_type}) completed successfully.")
        #             return f"Alerting for job {job_id} ({alert_type}) completed."
        #         time.sleep(sleep_interval)
        #     return f"Alerting for job {job_id} ({alert_type}) initiated, awaiting completion."

        tools = [
            analyze_dataset,
            trigger_quality_checker,
            trigger_reporting_agent
        ]

        # Updated prompt template with {tool_names} and standard ReAct format
        agent_prompt_template = """
You are a highly intelligent Data Quality Manager AI Agent. Your goal is to ensure the highest data quality
for incoming datasets and notify stakeholders appropriately.

You have access to the following tools:
{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

To achieve your goal, follow these steps:
1. **Analyze Dataset**: Use `analyze_dataset` to inspect the dataset and generate data quality check definitions. You must wait for the analysis to complete and obtain the `check_definitions` JSON.
2. **Perform Quality Checks**: Use `trigger_quality_checker` with the `data_ref` from step 1 and the `check_definitions` from step 1. You must wait for its completion and obtain the full quality results and return those results as 'quality_results'.
3. **Report Results**: Use 'trigger_reporting_agent' to upload the results to goole cloud storage recieved from step 2. Pass 'quality_results' string from step 2 to reporting function.

Begin!

Question: {input}
Thought:{agent_scratchpad}
"""

        agent_prompt = PromptTemplate.from_template(agent_prompt_template)
        logger.info("Agent prompt template formatted successfully.")

        LLM = _get_llm_client()
        agent = create_react_agent(LLM, tools, agent_prompt)
        _agent_executor_instance = AgentExecutor(agent=agent, tools=tools, verbose=True, handle_parsing_errors=True)
    return _agent_executor_instance

# --- Cloud Function Entry Point ---
def manager_agent_langchain(request):
    """
    Cloud Function for the LangChain-powered Manager Agent.
    Triggered by HTTP or Pub/Sub (via push subscription).
    """
    if request.method == 'POST':
        try:
            request_json = request.get_json(silent=True)
            if not request_json:
                envelope = json.loads(request.data.decode('utf-8'))
                message_data = base64.b64decode(envelope['message']['data']).decode('utf-8')
                message = json.loads(message_data)
            else:
                message = request_json

            event_type = message.get("event_type")
            gcs_uri = message.get("gcs_uri")
            job_id = message.get("job_id")

            if not event_type or not gcs_uri:
                raise ValueError("Missing required fields: event_type and gcs_uri")
            if not gcs_uri.startswith("gs://"):
                raise ValueError("Invalid GCS URI format")

            if event_type == "file_landing":
                logger.info(f"Manager Agent (LangChain) received file_landing event for Job ID: {job_id}, GCS URI: {gcs_uri}")
                _update_job_status(job_id, "MANAGER_AGENT_STARTED", {"gcs_uri": gcs_uri})

                goal = f"Ensure data quality for the file {gcs_uri} for job {job_id} and report any issues."

                try:
                    agent_executor = _get_agent_executor()
                    result = agent_executor.invoke({"input": goal})
                    logger.info(f"LangChain Agent finished job {job_id}. Final result: {result}")
                    _update_job_status(job_id, "MANAGER_AGENT_COMPLETED", {"final_agent_output": result})
                    return json.dumps({"status": "success", "job_id": job_id, "agent_output": result}), 200
                except Exception as e:
                    logger.error(f"Error running LangChain Agent for job {job_id}: {e}")
                    _update_job_status(job_id, "MANAGER_AGENT_FAILED", {"error": str(e)})
                    return json.dumps({"status": "error", "job_id": job_id, "message": str(e)}), 500

            else:
                logger.warning(f"Manager Agent received unhandled event type: {event_type} for job {job_id}")
                return json.dumps({"status": "ignored", "message": f"Unhandled event type: {event_type}"}), 200

        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Invalid request format: {e}")
            return json.dumps({"status": "error", "message": f"Invalid request format: {str(e)}"}), 400
        except Exception as e:
            logger.error(f"Error in manager_agent_langchain function: {e}", exc_info=True)
            return json.dumps({"status": "error", "message": str(e)}), 500
    else:
        return 'Only POST requests are accepted', 405