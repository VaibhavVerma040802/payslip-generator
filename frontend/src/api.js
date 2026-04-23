import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor to add bearer token
api.interceptors.request.use((config) => {
  // Determine which token to use based on the request URL
  // Staff portal routes typically start with /portal/ or /attendance/
  const isPortalRoute = config.url.startsWith('/portal/') || config.url.startsWith('/attendance/')
  
  let token = null
  if (isPortalRoute) {
    token = localStorage.getItem('staffToken') || localStorage.getItem('token')
  } else {
    token = localStorage.getItem('token') || localStorage.getItem('staffToken')
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message ||
      err.message ||
      'Something went wrong. Please try again.'
    return Promise.reject(new Error(message))
  }
)

export default api
