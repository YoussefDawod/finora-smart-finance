// src/types/api.types.ts

// ============================================
// Expense Types
// ============================================
export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string; // ISO 8601
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseRequest {
  description: string;
  amount: number;
  category: string;
  date?: string;
}

export interface UpdateExpenseRequest {
  description?: string;
  amount?: number;
  category?: string;
  date?: string;
}

export interface ExpenseListResponse {
  success: boolean;
  data: Expense[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ExpenseStatsResponse {
  success: boolean;
  data: {
    totalExpenses: number;
    totalAmount: number;
    averageExpense: number;
    byCategory: Record<string, number>;
    monthlyTrend: Array<{
      month: string;
      amount: number;
      count: number;
    }>;
  };
}

// ============================================
// API Response Wrapper
// ============================================
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
  message?: string;
}

// ============================================
// Error Types
// ============================================
export interface APIError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, string>;
  endpoint?: string;
  timestamp?: string;
}

// ============================================
// Pagination
// ============================================
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
