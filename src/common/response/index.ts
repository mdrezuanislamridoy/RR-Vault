export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data?: T;
}

export function successResponse<T>(message: string, data?: T): ApiResponse<T> {
  return { success: true, message, ...(data !== undefined && { data }) };
}

export function errorResponse(message: string): ApiResponse {
  return { success: false, message };
}
