import { isAxiosError } from "axios";

export default function apiError(error: unknown, fallback: string) {
  if (!isAxiosError<{ message?: string }>(error)) return fallback;
  if (!error.response) return "Could not reach the store. Check your connection and try again.";
  if (error.response.status === 403) return "You do not have permission to perform this action.";
  if (error.response.status >= 500) return fallback;
  return error.response.data?.message || fallback;
}
