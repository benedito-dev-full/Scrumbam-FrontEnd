export interface Lookup {
  chave: string;
  nome: string;
  codigo?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}
