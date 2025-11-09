import { projectId, publicAnonKey } from './info';

// Helper function to get the server URL
export function getServerUrl(path: string) {
  return `https://${projectId}.supabase.co/functions/v1/make-server-b509981e${path}`;
}

// Test if backend is accessible
export async function testBackendConnection() {
  try {
    const response = await fetch(getServerUrl('/health'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.warn('Backend health check failed:', response.status, response.statusText);
      // If 401, backend is deployed but requires auth configuration
      if (response.status === 401) {
        console.warn('Backend is deployed but requires JWT verification to be disabled in Supabase Dashboard');
      }
      return false;
    }
    
    const data = await response.json();
    console.log('Backend health check:', data);
    return data.status === 'ok';
  } catch (error: any) {
    console.error('Backend connection test failed:', error?.message || error);
    return false;
  }
}

// Helper function to make authenticated requests
export async function authFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('solo_levelling_token');
  
  if (!token) {
    // Return a rejected promise that mimics a 401 response
    return Promise.reject(new Error('No authentication token found'));
  }
  
  return fetch(getServerUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
}
