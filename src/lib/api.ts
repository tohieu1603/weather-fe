import axios from 'axios';

// API base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('Network Error:', error.message);
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const forecastApi = {
  // Get basin forecast with optional AI analysis
  getBasinForecast: async (basinName: string, includeAi = true, asyncMode = true) => {
    const response = await api.get(`/api/forecast/basin/${basinName}`, {
      params: { include_ai: includeAi, async_mode: asyncMode }
    });
    return response.data;
  },

  // Get AI job status
  getJobStatus: async (jobId: string) => {
    const response = await api.get(`/api/forecast/job/${jobId}`);
    return response.data;
  },

  // Get all forecasts for all basins
  getAllForecasts: async () => {
    const response = await api.get('/api/forecast/all', {
      timeout: 120000 // 120s timeout for first fetch
    });
    return response.data;
  },

  // Refresh forecasts
  refreshForecasts: async () => {
    const response = await api.post('/api/forecast/refresh');
    return response.data;
  },
};

export const basinsApi = {
  // Get basins summary
  getSummary: async () => {
    const response = await api.get('/api/basins/summary');
    return response.data;
  },
};

export const alertsApi = {
  // Get all alerts (blocking mode - for quick cache hits)
  getAlerts: async () => {
    const response = await api.get('/api/alerts');
    return response.data;
  },

  // Get all alerts (async mode - non-blocking for cache miss)
  getAlertsAsync: async () => {
    const response = await api.get('/api/alerts', {
      params: { async_mode: true }
    });
    return response.data;
  },

  // Get alert job status
  getJobStatus: async (jobId: string) => {
    const response = await api.get(`/api/alerts/job/${jobId}`);
    return response.data;
  },

  // Get combined alerts
  getCombined: async () => {
    const response = await api.get('/api/alerts/combined');
    return response.data;
  },
};

export const reservoirApi = {
  // Get EVN reservoir data
  getData: async () => {
    const response = await api.get('/api/evn/reservoirs');
    return response.data;
  },

  // Get reservoir analysis for a basin
  getAnalysis: async (basinCode: string) => {
    const response = await api.get(`/api/evn/analysis/${basinCode}`);
    return response.data;
  },
};

export const rainfallApi = {
  // Analyze rainfall by coordinates (lat/lon)
  analyzeByLocation: async (lat: number, lon: number, days: number = 7) => {
    const response = await api.get('/api/rainfall/analyze', {
      params: { lat, lon, days }
    });
    return response.data;
  },

  // Analyze rainfall by province code
  analyzeByProvince: async (provinceCode: string, days: number = 7) => {
    const response = await api.get(`/api/rainfall/province/${provinceCode}`, {
      params: { days }
    });
    return response.data;
  },

  // Search locations by name (district, ward, commune)
  searchLocations: async (query: string, limit: number = 10) => {
    const response = await api.get('/api/rainfall/search', {
      params: { q: query, limit }
    });
    return response.data;
  },

  // Get districts of a province
  getProvinceDistricts: async (provinceCode: string) => {
    const response = await api.get(`/api/rainfall/province/${provinceCode}/districts`);
    return response.data;
  },

  // Compare rainfall between multiple locations
  compare: async (locations: string[], days: number = 7) => {
    const response = await api.get('/api/rainfall/compare', {
      params: { locations: locations.join(','), days }
    });
    return response.data;
  },
};

export default api;
