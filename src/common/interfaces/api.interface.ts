// src/common/interfaces/api.interface.ts (new file)
export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  timestamp?: Date;
}

export interface PaginatedResponse<T> {
  statusCode: number;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp?: Date;
}
