import { useLocation } from 'wouter';

/**
 * A custom hook to extract search parameters from the URL
 * @returns An object similar to URLSearchParams
 */
export function useSearchParams() {
  const [location] = useLocation();
  
  // Extract the query string from the location
  const queryString = location.includes('?') 
    ? location.substring(location.indexOf('?') + 1) 
    : '';
    
  // Parse query parameters
  const params = new URLSearchParams(queryString);
  
  // Return an interface similar to URLSearchParams
  return {
    get: (key: string) => params.get(key),
    getAll: (key: string) => params.getAll(key),
    has: (key: string) => params.has(key),
    entries: () => params.entries(),
    toString: () => params.toString()
  };
} 