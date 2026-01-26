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

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email format";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      isValid = false;
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = "Password must contain at least one number";
      isValid = false;
    } else if (!/[a-zA-Z]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one letter";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [field]: e.target.value });
      if (errors[field as keyof typeof errors]) {
        setErrors({ ...errors, [field]: "", backend: "" });
      }
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
        setErrors({
          ...errors,
          backend: response.error || "Failed to create account",
        });
      }
    } catch (err) {
      setErrors({
        ...errors,
        backend: "Something went wrong. Please try again.",
      });
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
