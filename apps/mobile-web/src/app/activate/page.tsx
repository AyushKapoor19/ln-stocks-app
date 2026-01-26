"use client";

/**
 * Activate Page
 *
 * Entry point for device code verification
 * Users enter the code displayed on their TV
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { authService } from "@/services/authService";

export default function ActivatePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setCode(value);
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.length < 6) {
      setError("Please enter a valid code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await authService.verifyDeviceCode(code);

      if (response.success && response.authType) {
        if (response.authType === "signup") {
          router.push(`/activate/signup?code=${code}`);
        } else {
          router.push(`/activate/signin?code=${code}`);
        }
      } else {
        setError(response.error || "Invalid or expired code");
      }
    } catch (err) {
      setError("Failed to verify code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">
            LN Stocks
          </h1>
          <p className="text-lg text-text-secondary">Activate Your TV</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Enter the code from your TV
            </label>
            <Input
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="ABC123"
              error={error}
              autoFocus
              maxLength={8}
              className="text-center text-2xl tracking-widest uppercase"
            />
          </div>

          <Button type="submit" isLoading={isLoading}>
            Continue
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-tertiary">
          Open this page on your mobile device or computer to activate your TV
        </p>
      </Card>
    </div>
  );
}
