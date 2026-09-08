class ApiResponse<T, P> {
  success: boolean;
  message: string;
  data: T | null;
  pagination?: P | null;

  constructor(
    message: string,
    data: T | null = null,
    pagination: P | null = null,
  ) {
    this.success = true;
    this.message = message;
    this.data = data;
    this.pagination = pagination;
  }
}
export default ApiResponse;
