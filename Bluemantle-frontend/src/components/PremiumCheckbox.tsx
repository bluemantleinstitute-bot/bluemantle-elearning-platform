"use client";

import React from "react";
import "./PremiumCheckbox.css";

interface PremiumCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
}

export const PremiumCheckbox = React.forwardRef<HTMLInputElement, PremiumCheckboxProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <div className={`checkbox-wrapper w-fit ${className}`}>
        <input type="checkbox" ref={ref} {...props} />
        <div className="checkmark">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </div>
    );
  }
);

PremiumCheckbox.displayName = "PremiumCheckbox";
