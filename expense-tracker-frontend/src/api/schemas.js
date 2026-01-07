import { z } from 'zod';

// ============================================
// Expense Schemas
// ============================================
export const ExpenseSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1).max(255),
  amount: z.number().positive(),
  category: z.string(),
  date: z.string().datetime().or(z.string().date()), // Allow date or datetime string
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateExpenseSchema = z.object({
  description: z.string().min(1).max(255),
  amount: z.number().positive(),
  category: z.string().min(1),
  date: z.string().date().optional(),
});

export const UpdateExpenseSchema = z.object({
  description: z.string().min(1).max(255).optional(),
  amount: z.number().positive().optional(),
  category: z.string().min(1).optional(),
  date: z.string().date().optional(),
});

// ============================================
// API Response Schemas
// ============================================
export const APIResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string()).optional(),
  }).optional(),
});

// ============================================
// Validation Helper
// ============================================
export const validateData = (schema, data) => {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.flatten();
    return {
      valid: false,
      errors: errors.fieldErrors,
    };
  }

  return {
    valid: true,
    data: result.data,
  };
};
