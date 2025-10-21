const API_CONFIG = {
  development: 'http://localhost:8080',
  production: 'https://uuhbugpchzxalvqzaxiy.supabase.co/functions/v1'
};

const FORCE_PRODUCTION = true; // Temporarily force production for local testing

export const API_BASE_URL = FORCE_PRODUCTION ? API_CONFIG.production : (API_CONFIG[process.env.NODE_ENV] || API_CONFIG.development);

export const getApiUrl = (endpoint) => {
  const baseUrl = FORCE_PRODUCTION ? API_CONFIG.production : (API_CONFIG[process.env.NODE_ENV] || API_CONFIG.development);
  if (FORCE_PRODUCTION || process.env.NODE_ENV === 'production') {
    return `${baseUrl}/${endpoint}`;
  } else {
    const endpointMap = {
      'signin': 'auth/signin',
      'signup': 'auth/signup',
      'transactions-create': 'transactions',
      'transactions-get': 'transactions',
      'transactions-update': 'transactions',
      'transactions-delete': 'transactions',
      'budgets-create': 'budgets',
      'budgets-get': 'budgets',
      'budgets-update': 'budgets',
      'budgets-delete': 'budgets',
      'investments-create': 'investments',
      'investments-get': 'investments',
      'investments-update': 'investments',
      'investments-delete': 'investments'
    };
    const mappedEndpoint = endpointMap[endpoint] || endpoint;
    return `${baseUrl}/api/${mappedEndpoint}`;
  }
};

// Finnhub API configuration
export const FINNHUB_CONFIG = {
  apiKey: process.env.REACT_APP_FINNHUB_API_KEY || '',
  baseURL: 'https://finnhub.io/api/v1'
};

// Check if API key is configured
export const isFinnhubConfigured = () => {
  return !!process.env.REACT_APP_FINNHUB_API_KEY;
};