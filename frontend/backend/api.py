from flask import Flask, jsonify
from datetime import datetime, timedelta
import random

app = Flask(__name__)

# Enums
class AgentStatus:
    Active = "Active"
    Inactive = "Inactive"

class RunStatus:
    Success = "Success"
    Failed = "Failed"
    Running = "Running"

class CheckStatus:
    Passed = "Passed"
    Failed = "Failed"
    Warning = "Warning"

class DataLayer:
    Raw = "Raw"
    Defined = "Defined"
    Derived = "Derived"

class Trend:
    Up = "up"
    Down = "down"
    Stable = "stable"

# Static Data
AGENTS = [
    { 'id': 'agent-1', 'name': 'Data Quality Agent', 'status': AgentStatus.Active, 'lastRun': (datetime.now() - timedelta(minutes=15)).isoformat() + 'Z' },
    { 'id': 'agent-2', 'name': 'Data Transfer Agent', 'status': AgentStatus.Active, 'lastRun': (datetime.now() - timedelta(minutes=5)).isoformat() + 'Z' },
]

HISTORY_RUNS = [
    { 'id': 'run-1', 'agentName': 'Data Quality Agent', 'timestamp': (datetime.now() - timedelta(minutes=15)).isoformat() + 'Z', 'status': RunStatus.Success, 'duration': '2m 15s', 'dataObjectId': 'do-1', 'dataObjectVersion': 'v1.2.3' },
    { 'id': 'run-2', 'agentName': 'Data Transfer Agent', 'timestamp': (datetime.now() - timedelta(minutes=5)).isoformat() + 'Z', 'status': RunStatus.Success, 'duration': '45s', 'dataObjectId': 'do-2', 'dataObjectVersion': 'v2.0.1' },
    { 'id': 'run-3', 'agentName': 'Data Quality Agent', 'timestamp': (datetime.now() - timedelta(hours=1)).isoformat() + 'Z', 'status': RunStatus.Success, 'duration': '2m 10s', 'dataObjectId': 'do-1', 'dataObjectVersion': 'v1.2.2' },
    { 'id': 'run-4', 'agentName': 'Data Transfer Agent', 'timestamp': (datetime.now() - timedelta(hours=2)).isoformat() + 'Z', 'status': RunStatus.Failed, 'duration': '1m 5s', 'dataObjectId': 'do-2', 'dataObjectVersion': 'v2.0.0' },
    { 'id': 'run-5', 'agentName': 'Data Quality Agent', 'timestamp': (datetime.now() - timedelta(hours=4)).isoformat() + 'Z', 'status': RunStatus.Success, 'duration': '2m 30s', 'dataObjectId': 'do-3', 'dataObjectVersion': 'v1.5.0' },
]

def generate_checks(count: int):
    checks = []
    check_names = ['Null Check', 'Uniqueness', 'Format Validation', 'Range Check', 'Referential Integrity']
    for i in range(count):
        status = random.choices([CheckStatus.Failed, CheckStatus.Warning, CheckStatus.Passed], weights=[0.1, 0.1, 0.8])[0]
        checks.append({
            'id': f'check-{i}',
            'name': check_names[i % len(check_names)],
            'status': status,
            'timestamp': (datetime.now() - timedelta(days=random.random())).isoformat() + 'Z'
        })
    return checks

DATA_OBJECTS = [
    {
        'id': 'do-1',
        'name': 'customers',
        'version': '1.2.3',
        'layer': DataLayer.Raw,
        'description': 'Raw customer data ingested from CRM system.',
        'checks': generate_checks(5),
        'qualityMetrics': [
            { 'name': 'Freshness', 'value': '15m ago', 'trend': Trend.Stable },
            { 'name': 'Completeness', 'value': '98.5%', 'trend': Trend.Up },
            { 'name': 'Accuracy', 'value': '92.1%', 'trend': Trend.Down },
            { 'name': 'Validity', 'value': '99.7%', 'trend': Trend.Stable },
        ],
    },
    {
        'id': 'do-2',
        'name': 'orders',
        'version': '2.0.1',
        'layer': DataLayer.Defined,
        'description': 'Cleaned and structured customer order information.',
        'checks': generate_checks(8),
        'qualityMetrics': [
            { 'name': 'Freshness', 'value': '30m ago', 'trend': Trend.Stable },
            { 'name': 'Completeness', 'value': '99.8%', 'trend': Trend.Up },
            { 'name': 'Accuracy', 'value': '99.5%', 'trend': Trend.Up },
            { 'name': 'Validity', 'value': '100%', 'trend': Trend.Stable },
        ],
    },
    {
        'id': 'do-3',
        'name': 'monthly_revenue',
        'version': '1.5.0',
        'layer': DataLayer.Derived,
        'description': 'Aggregated monthly revenue report for analytics.',
        'checks': generate_checks(4),
        'qualityMetrics': [
            { 'name': 'Freshness', 'value': '1h ago', 'trend': Trend.Stable },
            { 'name': 'Completeness', 'value': '100%', 'trend': Trend.Stable },
            { 'name': 'Accuracy', 'value': '100%', 'trend': Trend.Stable },
            { 'name': 'Validity', 'value': '100%', 'trend': Trend.Stable },
        ],
    },
]

@app.route('/api/v1/dashboard-data', methods=['GET'])
def get_dashboard_data():
    return jsonify({
        "data": {
            "agents": AGENTS,
            "historyRuns": HISTORY_RUNS,
            "dataObjects": DATA_OBJECTS
        }
    })

if __name__ == '__main__':
    app.run(debug=True)