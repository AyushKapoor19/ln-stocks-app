/**
 * Form Validation Utilities
 *
 * Centralized validation functions for user input
 */

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateEmailField(email: string): string {
  if (!email.trim()) {
    return "Email is required";
  }
  if (!validateEmail(email)) {
    return "Invalid email format";
  }
  return "";
}

export function validatePassword(password: string): string {
  if (!password) {
    return "Password is required";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }
  return "";
}

export function validatePasswordStrength(password: string): string {
  const baseError = validatePassword(password);
  if (baseError) return baseError;

  if (!/\d/.test(password)) {
    return "Password must contain at least one number";
  }
  if (!/[a-zA-Z]/.test(password)) {
    return "Password must contain at least one letter";
  }
  return "";
}
