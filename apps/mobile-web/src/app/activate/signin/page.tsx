"use client";

/**
 * Sign In Page
 *
 * Existing user authentication form for device code activation
 */

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { authService } from "@/services/authService";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
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
      email: "",
      password: "",
      backend: "",
    };
    let isValid = true;

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
    setErrors({ email: "", password: "", backend: "" });

    try {
      const response = await authService.approveDeviceCode(
        code,
        formData.email,
        formData.password
      );

      if (response.success) {
        router.push("/activate/success");
      } else {
        setErrors({
          ...errors,
          backend: response.error || "Invalid email or password",
        });
      }
    } catch (err) {
      setErrors({
        ...errors,
        backend: "Something went wrong. Please try again.",
      });
      console.error("Sign in error:", err);
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
          <h1 className="text-3xl font-bold text-text-primary mb-2">Sign In</h1>
          <p className="text-sm text-text-secondary">
            Code: <span className="font-mono text-primary">{code}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            type="email"
            value={formData.email}
            onChange={handleChange("email")}
            placeholder="investor@wallstreet.com"
            error={errors.email}
            autoFocus
          />

          <Input
            type="password"
            value={formData.password}
            onChange={handleChange("password")}
            placeholder="••••••••"
            error={errors.password}
          />

          {errors.backend && (
            <div className="p-3 bg-error bg-opacity-10 border border-error rounded-lg">
              <p className="text-sm text-error text-center">{errors.backend}</p>
            </div>
          )}

          <Button type="submit" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-text-tertiary">
            Don't have an account?{" "}
            <button
              onClick={() => router.push(`/activate/signup?code=${code}`)}
              className="text-primary hover:text-primary-light underline"
            >
              Sign Up
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
