const API_CONFIG = {
  development: 'http://localhost:8080',
  production: process.env.REACT_APP_API_URL || 'http://localhost:8080'
};

export const API_BASE_URL = API_CONFIG[process.env.NODE_ENV] || API_CONFIG.development;