import { cn } from "@/lib/utils";
import React from "react";

interface KnowledgeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function KnowledgeCard({ children, className, ...props }: KnowledgeCardProps) {
  return (
    <div className={cn("knowledge-card p-6", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: KnowledgeCardProps) {
  return <div className={cn("mb-6", className)}>{children}</div>;
}

export function CardTitle({ children, className, as: Component = "h3" }: KnowledgeCardProps & { as?: "h1" | "h2" | "h3" | "h4" }) {
  return <Component className={cn("text-xl font-manrope font-bold text-on_surface", className)}>{children}</Component>;
}

export function CardBody({ children, className }: KnowledgeCardProps) {
  return <div className={cn("text-on_surface_variant", className)}>{children}</div>;
}
