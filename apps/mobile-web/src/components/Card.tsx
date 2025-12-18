/**
 * Card Component
 *
 * Container card for authentication forms
 */

import React from "react";

interface ICardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<ICardProps> = ({ children, className = "" }) => {
  return (
    <div
      className={`w-full max-w-md bg-background-card rounded-2xl p-8 shadow-2xl ${className}`}
    >
      {children}
    </div>
  );
};
