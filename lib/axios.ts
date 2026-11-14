import axios from "axios";

// Single axios instance for all client-side API calls. Route handlers live
// under /api, so every feature talks to `api.get("/items")` etc.
export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Normalise errors so TanStack Query / sonner always get a clean message
// taken from the route handler's `{ message }` body.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong";
    return Promise.reject(new Error(message));
  },
);
