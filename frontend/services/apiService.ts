
import type { DQReport } from '../types';

const API_URL = './output.json';

/**
 * API SERVICE
 *
 * Fetches the data quality report from the backend.
 */
export const fetchDashboardData = async (): Promise<DQReport> => {
  console.log(`API Call: Fetching data quality report from ${API_URL}...`);
  
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('API Error Response:', errorBody);
        throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
    }

    const responseData: DQReport = await response.json();
    
    console.log('API Response: Data quality report received.', responseData);
    return responseData;
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    // Re-throw the error so it can be caught by the calling component
    throw error;
  }
};