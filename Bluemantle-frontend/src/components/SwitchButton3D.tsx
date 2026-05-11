"use client";

import React from "react";
import "./SwitchButton3D.css";

interface SwitchButton3DProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function SwitchButton3D({ children, className = "", ...props }: SwitchButton3DProps) {
  return (
    <button className={`button-3d ${className}`} {...props}>
      <div className="button-base"></div>
      <div className="button-bottom"></div>
      <div className="button-top">
        {children}
      </div>
    </button>
  );
}
