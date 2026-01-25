/**
 * @fileoverview useForm Hook Tests
 * @description Tests für den useForm Custom Hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useForm } from '../useForm';

describe('useForm', () => {
  const initialValues = {
    email: '',
    password: '',
    name: '',
  };

  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  describe('initialization', () => {
    it('should initialize with given values', () => {
      const { result } = renderHook(() => 
        useForm({ email: 'test@test.com', password: '' }, mockOnSubmit)
      );

      expect(result.current.values).toEqual({ email: 'test@test.com', password: '' });
    });

    it('should initialize with empty objects by default', () => {
      const { result } = renderHook(() => useForm({}, mockOnSubmit));

      expect(result.current.values).toEqual({});
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('handleChange', () => {
    it('should update values on change', () => {
      const { result } = renderHook(() => useForm(initialValues, mockOnSubmit));

      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'new@email.com', type: 'text' },
        });
      });

      expect(result.current.values.email).toBe('new@email.com');
    });

    it('should handle checkbox inputs', () => {
      const { result } = renderHook(() => 
        useForm({ remember: false }, mockOnSubmit)
      );

      act(() => {
        result.current.handleChange({
          target: { name: 'remember', checked: true, type: 'checkbox' },
        });
      });

      expect(result.current.values.remember).toBe(true);
    });

    it('should clear error for field on change', () => {
      const { result } = renderHook(() => useForm(initialValues, mockOnSubmit));

      // Set an error first
      act(() => {
        result.current.setFieldError('email', 'Email is required');
      });

      expect(result.current.errors.email).toBe('Email is required');

      // Now change the field
      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'test@test.com', type: 'text' },
        });
      });

      expect(result.current.errors.email).toBe('');
    });
  });

  describe('handleBlur', () => {
    it('should mark field as touched on blur', () => {
      const { result } = renderHook(() => useForm(initialValues, mockOnSubmit));

      expect(result.current.touched.email).toBeFalsy();

      act(() => {
        result.current.handleBlur({
          target: { name: 'email' },
        });
      });

      expect(result.current.touched.email).toBe(true);
    });
  });

  describe('handleSubmit', () => {
    it('should call onSubmit with values', async () => {
      const { result } = renderHook(() => 
        useForm({ email: 'test@test.com' }, mockOnSubmit)
      );

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() });
      });

      expect(mockOnSubmit).toHaveBeenCalledWith({ email: 'test@test.com' });
    });

    it('should set isSubmitting during submission', async () => {
      let resolveSubmit;
      const slowSubmit = vi.fn(() => new Promise((resolve) => {
        resolveSubmit = resolve;
      }));

      const { result } = renderHook(() => useForm(initialValues, slowSubmit));

      let submitPromise;
      act(() => {
        submitPromise = result.current.handleSubmit({ preventDefault: vi.fn() });
      });

      expect(result.current.isSubmitting).toBe(true);

      await act(async () => {
        resolveSubmit();
        await submitPromise;
      });

      expect(result.current.isSubmitting).toBe(false);
    });

    it('should prevent default form submission', async () => {
      const preventDefault = vi.fn();
      const { result } = renderHook(() => useForm(initialValues, mockOnSubmit));

      await act(async () => {
        await result.current.handleSubmit({ preventDefault });
      });

      expect(preventDefault).toHaveBeenCalled();
    });
  });

  describe('validation with custom validator', () => {
    const customValidator = (values) => {
      const errors = {};
      if (!values.email) {
        errors.email = 'Email is required';
      } else if (!values.email.includes('@')) {
        errors.email = 'Invalid email format';
      }
      if (!values.password || values.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      return errors;
    };

    it('should validate and prevent submit with errors', async () => {
      const { result } = renderHook(() => 
        useForm(initialValues, mockOnSubmit, customValidator)
      );

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() });
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(result.current.errors.email).toBe('Email is required');
      expect(result.current.errors.password).toBe('Password must be at least 6 characters');
    });

    it('should submit when validation passes', async () => {
      const { result } = renderHook(() => 
        useForm(
          { email: 'valid@email.com', password: 'password123', name: 'Test' },
          mockOnSubmit,
          customValidator
        )
      );

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() });
      });

      expect(mockOnSubmit).toHaveBeenCalled();
      expect(result.current.errors).toEqual({});
    });

    it('should validate on blur when schema is provided', () => {
      const { result } = renderHook(() => 
        useForm(initialValues, mockOnSubmit, customValidator)
      );

      // Set value first
      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'invalid', type: 'text' },
        });
      });

      // Then blur
      act(() => {
        result.current.handleBlur({ target: { name: 'email' } });
      });

      expect(result.current.errors.email).toBe('Invalid email format');
    });
  });

  describe('utility methods', () => {
    it('should reset form to initial values', () => {
      const { result } = renderHook(() => useForm(initialValues, mockOnSubmit));

      // Change values
      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'changed@email.com', type: 'text' },
        });
        result.current.handleBlur({ target: { name: 'email' } });
      });

      // Reset
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
    });

    it('should set individual field values', () => {
      const { result } = renderHook(() => useForm(initialValues, mockOnSubmit));

      act(() => {
        result.current.setFieldValue('email', 'programmatic@email.com');
      });

      expect(result.current.values.email).toBe('programmatic@email.com');
    });

    it('should set individual field errors', () => {
      const { result } = renderHook(() => useForm(initialValues, mockOnSubmit));

      act(() => {
        result.current.setFieldError('email', 'Custom error message');
      });

      expect(result.current.errors.email).toBe('Custom error message');
    });

    it('should set all values at once', () => {
      const { result } = renderHook(() => useForm(initialValues, mockOnSubmit));

      const newValues = { email: 'new@email.com', password: 'newpass', name: 'New Name' };
      
      act(() => {
        result.current.setValues(newValues);
      });

      expect(result.current.values).toEqual(newValues);
    });
  });
});
