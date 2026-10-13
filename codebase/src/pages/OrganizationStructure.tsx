import React from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import ScrollReveal from "../components/ScrollReveal";
import FloatingShapes from "../components/FloatingShapes";

const OrganizationStructure: React.FC = () => {
  return (
    <div>
      {/* Hero */}
      <section className="bg-surface border-b border-border relative overflow-hidden">
        <FloatingShapes variant="hero" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <ScrollReveal>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors mb-6"
            >
              <ArrowLeft size={16} />
              Back to About
            </Link>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <span className="text-secondary text-sm font-semibold tracking-widest uppercase">
              Governance
            </span>
          </ScrollReveal>
          <ScrollReveal delay={150}>
            <h1 className="font-heading font-bold text-4xl lg:text-5xl text-primary mt-3">
              BEI Organizational Structure
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="w-20 h-1 bg-accent mt-4 rounded-full" />
          </ScrollReveal>
          <ScrollReveal delay={250}>
            <p className="mt-6 text-text-muted text-lg leading-relaxed max-w-2xl">
              Our institutional framework ensures effective governance, academic excellence, 
              and comprehensive support for our educational mission.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Organization Chart */}
      <section className="py-20 lg:py-28 relative">
        <FloatingShapes />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="border border-border rounded-lg overflow-hidden bg-surface p-8 lg:p-12">
              <img
                src="/public_e645_208b4738678446638d5758cc5a1c4263.png"
                alt="BEI Organizational Structure Chart"
                className="w-full h-auto"
              />
            </div>
          </ScrollReveal>

          {/* Key Components Explanation */}
          <ScrollReveal delay={150}>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-border rounded-lg p-6 bg-bg hover:border-accent transition-colors duration-300">
                <h3 className="font-heading font-semibold text-lg text-primary mb-3">
                  Governance
                </h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  Led by the Patron, University Council, and Chancellor, ensuring strategic 
                  direction and institutional integrity.
                </p>
              </div>

              <div className="border border-border rounded-lg p-6 bg-bg hover:border-accent transition-colors duration-300">
                <h3 className="font-heading font-semibold text-lg text-primary mb-3">
                  Academic Excellence
                </h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  The Academic Senate and Faculty of Humanities, Sciences and Social Sciences 
                  maintain educational quality and curriculum standards.
                </p>
              </div>

              <div className="border border-border rounded-lg p-6 bg-bg hover:border-accent transition-colors duration-300">
                <h3 className="font-heading font-semibold text-lg text-primary mb-3">
                  Support Services
                </h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  Administrative offices and campus services provide comprehensive support 
                  for students, faculty, and institutional operations.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
};

export default OrganizationStructure;