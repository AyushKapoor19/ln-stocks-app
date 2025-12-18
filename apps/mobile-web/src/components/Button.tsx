/**
 * Button Component
 *
 * Reusable button with loading state
 */

import React from "react";

interface IButtonProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  isLoading?: boolean;
  variant?: "primary" | "secondary";
  className?: string;
}

export const Button: React.FC<IButtonProps> = ({
  onClick,
  children,
  type = "button",
  disabled = false,
  isLoading = false,
  variant = "primary",
  className = "",
}) => {
  const baseStyles =
    "w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    primary: "bg-primary hover:bg-primary-light text-white",
    secondary:
      "bg-background-card hover:bg-background-input text-text-primary border-2 border-border",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {isLoading ? "Loading..." : children}
    </button>
  );
};
