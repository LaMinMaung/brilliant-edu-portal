import React from "react";

interface Props {
  variant?: "hero" | "section";
}

const FloatingShapes: React.FC<Props> = ({ variant = "section" }) => {
  if (variant === "hero") {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-accent/10 animate-morph"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="absolute top-1/3 -left-16 w-48 h-48 rounded-full bg-sky/10 animate-morph"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute bottom-20 right-1/4 w-32 h-32 rounded-full bg-secondary/10 animate-morph"
          style={{ animationDelay: "4s" }}
        />
        <div className="absolute top-20 left-1/3 w-4 h-4 rounded-full bg-accent/30 animate-float" />
        <div
          className="absolute bottom-1/3 right-1/3 w-3 h-3 rounded-full bg-sky/40 animate-float-slow"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-2 h-2 rounded-full bg-secondary/30 animate-float"
          style={{ animationDelay: "3s" }}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-accent/5 animate-pulse-glow" />
      <div
        className="absolute bottom-10 -left-10 w-32 h-32 rounded-full bg-sky/5 animate-pulse-glow"
        style={{ animationDelay: "1.5s" }}
      />
    </div>
  );
};

export default FloatingShapes;