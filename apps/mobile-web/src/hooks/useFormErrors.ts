/**
 * Form Errors Hook
 *
 * Custom hook for managing form error state with field-level clearing
 */

import { useState } from "react";

export function useFormErrors<T extends Record<string, string>>(
  initialErrors: T
) {
  const [errors, setErrors] = useState<T>(initialErrors);

  const clearError = (field: keyof T): void => {
    if (errors[field]) {
      const updated = Object.assign({}, errors, { [field]: "", backend: "" });
      setErrors(updated as T);
    }
  };

  return { errors, setErrors, clearError };
}
