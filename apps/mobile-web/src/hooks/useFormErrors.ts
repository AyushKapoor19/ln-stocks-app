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

  const clearAllErrors = (): void => {
    const cleared = Object.keys(errors).reduce((acc, key) => {
      acc[key as keyof T] = "" as T[keyof T];
      return acc;
    }, {} as T);
    setErrors(cleared);
  };

  return { errors, setErrors, clearError, clearAllErrors };
}
