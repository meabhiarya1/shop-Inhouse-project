import axios from 'axios';

let navigate = null;
let logout = null;

// Function to set navigation and logout functions from components
export const setupAxiosInterceptors = (navigateFn, logoutFn) => {
  navigate = navigateFn;
  logout = logoutFn;
};

// Request interceptor to add auth token to headers
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authentication errors
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check if error is due to authentication issues
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Token is invalid or expired
      if (logout) {
        logout();
      }
      
      // Redirect to login page
      if (navigate) {
        navigate('/login', { replace: true });
      } else {
        // Fallback if navigate is not set
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default axios;
