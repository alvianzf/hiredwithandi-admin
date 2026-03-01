import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
});

// Request interceptor to add the auth token
api.interceptors.request.use(
  (config) => {
    const session = localStorage.getItem("hwa_admin_session");
    if (session) {
      try {
        const { token } = JSON.parse(session);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        console.error("Failed to parse admin session token", e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/")
    ) {
      originalRequest._retry = true;
      try {
        const sessionStr = localStorage.getItem("hwa_admin_session");
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          if (session.refreshToken) {
            const refreshRes = await axios.post(
              api.defaults.baseURL + "/auth/refresh",
              {
                refreshToken: session.refreshToken,
              },
            );
            const { token, refreshToken, user } = refreshRes.data.data;
            const newSession = {
              ...session,
              token,
              refreshToken,
            };
            localStorage.setItem(
              "hwa_admin_session",
              JSON.stringify(newSession),
            );

            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error("Token refresh failed", refreshError);
        localStorage.removeItem("hwa_admin_session");
      }
    }
    return Promise.reject(error);
  },
);

export default api;
