/**
 * API Client utility for making calls to the backend API
 * This ensures all API calls go to the correct server based on environment
 */

// Define the base URL based on environment
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api' // In development, API server runs on port 5000
  : '/api'; // In production, API calls are served from the same domain

/**
 * Helper function to prepare headers for API requests
 */
const prepareHeaders = (options?: RequestInit): Headers => {
  const headers = new Headers(options?.headers || {});
  
  // Set default Content-Type if not already set
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  return headers;
};

/**
 * Make an API call with proper error handling
 */
export async function callApi(
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  // Remove any leading slash from endpoint to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Construct the full URL
  const url = `${API_BASE_URL}/${cleanEndpoint}`;
  
  console.log('API call to:', url);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: prepareHeaders(options),
      credentials: 'include',
    });
    
    if (!response.ok && !options?.signal?.aborted) {
      console.error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw new Error(`API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * GET request helper
 */
export function getFromApi(endpoint: string, options?: RequestInit): Promise<Response> {
  return callApi(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request helper
 */
export function postToApi(endpoint: string, data: any, options?: RequestInit): Promise<Response> {
  return callApi(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * PUT request helper
 */
export function putToApi(endpoint: string, data: any, options?: RequestInit): Promise<Response> {
  return callApi(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

/**
 * DELETE request helper
 */
export function deleteFromApi(endpoint: string, options?: RequestInit): Promise<Response> {
  return callApi(endpoint, { ...options, method: 'DELETE' });
} 