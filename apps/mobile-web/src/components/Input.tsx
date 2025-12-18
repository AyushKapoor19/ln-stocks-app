/**
 * Input Component
 * 
 * Reusable input field with error state and animations
 */

import React from 'react';

interface IInputProps {
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  error?: string;
  autoFocus?: boolean;
  maxLength?: number;
  className?: string;
}

export const Input: React.FC<IInputProps> = ({
  type,
  value,
  onChange,
  placeholder,
  error,
  autoFocus,
  maxLength,
  className = '',
}) => {
  return (
    <div className="w-full">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        maxLength={maxLength}
        className={`w-full px-4 py-3 bg-background-input text-text-primary rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-primary ${
          error ? 'border-error animate-shake' : 'border-transparent focus:border-primary'
        } ${className}`}
      />
      {error && (
        <p className="mt-2 text-sm text-error animate-fade-in">{error}</p>
      )}
    </div>
  );
};

