const hostname = window.location.hostname;

// if frontend is opened from another PC like http://192.168.15.80:5173
// this will call backend on the same host, port 8080
export const API_BASE =
  import.meta.env.VITE_API_BASE || `http://${hostname}:8080`;