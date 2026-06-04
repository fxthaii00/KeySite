/**
 * Tracking Service - Client-side wrapper for Cloud Functions
 * Handles key validation & analytics fetching
 */

const CLOUD_FUNCTION_URL = import.meta.env.VITE_CLOUD_FUNCTION_URL || 'http://localhost:5001/lizardhub-project-key/us-central1';

/**
 * Validate a key (tracks IP, launch, usage)
 */
export async function validateKeyWithTracking(key, gameName, executor, hwid) {
  try {
    const response = await fetch(`${CLOUD_FUNCTION_URL}/validateKey`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, gameName, executor, hwid }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error validating key:', error);
    return { valid: false, message: error.message };
  }
}

/**
 * Get admin analytics (launches, top keys, anomalies)
 */
export async function getTrackingAnalytics() {
  try {
    const response = await fetch(`${CLOUD_FUNCTION_URL}/getAnalytics`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return null;
  }
}

/**
 * Get detailed history for a specific key
 */
export async function getKeyHistory(key) {
  try {
    const response = await fetch(`${CLOUD_FUNCTION_URL}/getKeyHistory?key=${encodeURIComponent(key)}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching key history:', error);
    return null;
  }
}
