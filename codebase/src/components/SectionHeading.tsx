import React from "react";
import ScrollReveal from "./ScrollReveal";

interface Props {
  label?: string;
  title: string;
  subtitle?: string;
}

const SectionHeading: React.FC<Props> = ({ label, title, subtitle }) => (
  <ScrollReveal className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
    {label && (
      <span className="text-secondary text-sm font-semibold tracking-widest uppercase">
        {label}
      </span>
    )}
    <h2 className="font-heading font-bold text-3xl lg:text-4xl text-primary mt-2">
      {title}
    </h2>
    <div className="w-16 h-1 bg-accent mx-auto mt-4 rounded-full" />
    {subtitle && (
      <p className="mt-4 text-text-muted leading-relaxed">{subtitle}</p>
    )}
  </ScrollReveal>
);

export default SectionHeading;