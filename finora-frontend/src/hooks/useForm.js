import { useState, useCallback } from 'react';

/**
 * Custom hook for form handling with validation (supports Zod & custom validators)
 * @param {Object} initialValues - Initial form values
 * @param {Function} onSubmit - Submit handler
 * @param {Function|Object} schema - Validation function or Zod schema
 */
export const useForm = (initialValues = {}, onSubmit, schema) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ──────────────────────────────────────────────────────────────────────
  // VALIDATE FUNCTION - supports both Zod schemas and custom functions
  // ──────────────────────────────────────────────────────────────────────
  const validateField = useCallback((data) => {
    if (!schema) return {};

    // Check if it's a Zod schema (has .parse method)
    if (schema.parse || schema.parseAsync) {
      try {
        schema.parse(data);
        return {};
      } catch (error) {
        const fieldErrors = {};
        if (error.errors && Array.isArray(error.errors)) {
          error.errors.forEach((err) => {
            const path = err.path.join('.');
            fieldErrors[path] = err.message;
          });
        }
        return fieldErrors;
      }
    }

    // Otherwise treat it as a custom validation function
    if (typeof schema === 'function') {
      return schema(data) || {};
    }

    return {};
  }, [schema]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  }, [errors]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validate single field on blur
    if (schema) {
      const fieldErrors = validateField(values);
      if (fieldErrors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: fieldErrors[name],
        }));
      }
    }
  }, [schema, values, validateField]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate all fields
    if (schema) {
      const validationErrors = validateField(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setIsSubmitting(false);
        return;
      }
    }

    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
      // Error is already handled in the onSubmit callback
      // No need to re-throw here
    } finally {
      setIsSubmitting(false);
    }
  }, [values, schema, validateField, onSubmit]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
    setValues,
  };
};
