'use client';

/**
 * Success Page
 * 
 * Confirmation page after successful device activation
 */

import React from 'react';
import { Card } from '@/components/Card';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-success rounded-full mx-auto flex items-center justify-center mb-4">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Success!
          </h1>
          <p className="text-lg text-text-secondary">
            Your TV has been activated
          </p>
        </div>

        <div className="space-y-4 text-text-tertiary">
          <p>
            You can now return to your TV and start using LN Stocks.
          </p>
          <p className="text-sm">
            This window can be closed.
          </p>
        </div>
      </Card>
    </div>
  );
}

