"use client";

/**
 * Sign Up Page
 *
 * New user registration form for device code activation
 */

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { authService } from "@/services/authService";
import { validateEmailField, validatePasswordStrength } from "@/utils/validation";
import { useFormErrors } from "@/hooks/useFormErrors";

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
  });
  const { errors, setErrors, clearError } = useFormErrors({
    displayName: "",
    email: "",
    password: "",
    backend: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!code) {
      router.push("/activate");
    }
  }, [code, router]);

  const validateForm = (): boolean => {
    const newErrors = {
      displayName: "",
      email: "",
      password: "",
      backend: "",
    };
    let isValid = true;

    if (!formData.displayName.trim()) {
      newErrors.displayName = "Name is required";
      isValid = false;
    }

    const emailError = validateEmailField(formData.email);
    if (emailError) {
      newErrors.email = emailError;
      isValid = false;
    }

    const passwordError = validatePasswordStrength(formData.password);
    if (passwordError) {
      newErrors.password = passwordError;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const updated = Object.assign({}, formData, { [field]: e.target.value });
      setFormData(updated);
      clearError(field as keyof typeof errors);
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !code) {
      return;
    }

    setIsLoading(true);
    setErrors({ displayName: "", email: "", password: "", backend: "" });

    try {
      const response = await authService.approveDeviceCodeWithSignUp(
        code,
        formData,
      );

      if (response.success) {
        router.push("/activate/success");
      } else {
        setErrors({ displayName: "", email: "", password: "", backend: response.error || "Failed to create account" });
      }
    } catch {
      setErrors({ displayName: "", email: "", password: "", backend: "Something went wrong. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  if (!code) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Create Your Account
          </h1>
          <p className="text-sm text-text-secondary">
            Code: <span className="font-mono text-primary">{code}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            type="text"
            value={formData.displayName}
            onChange={handleChange("displayName")}
            placeholder="Warren Buffett"
            error={errors.displayName}
            autoFocus
          />

          <Input
            type="email"
            value={formData.email}
            onChange={handleChange("email")}
            placeholder="investor@wallstreet.com"
            error={errors.email}
          />

          <Input
            type="password"
            value={formData.password}
            onChange={handleChange("password")}
            placeholder="Create a secure password"
            error={errors.password}
          />

          {errors.backend && (
            <div className="p-3 bg-error bg-opacity-10 border border-error rounded-lg">
              <p className="text-sm text-error text-center">{errors.backend}</p>
            </div>
          )}

          <Button type="submit" isLoading={isLoading}>
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-text-tertiary">
            Already have an account?{" "}
            <button
              onClick={() => router.push(`/activate/signin?code=${code}`)}
              className="text-primary hover:text-primary-light underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpContent />
    </Suspense>
  );
}
