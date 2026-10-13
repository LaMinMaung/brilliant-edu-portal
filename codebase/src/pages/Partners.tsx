import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Globe } from "lucide-react";
import pb from "../lib/pocketbase";
import ScrollReveal from "../components/ScrollReveal";
import SectionHeading from "../components/SectionHeading";
import FloatingShapes from "../components/FloatingShapes";

const Partners: React.FC = () => {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pb.collection("collaborators")
      .getFullList({
        filter: 'status = "active"',
        sort: "displayOrder,name",
        requestKey: null,
      })
      .then((data) => {
        setPartners(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load partners:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-surface border-b border-border relative overflow-hidden">
        <FloatingShapes variant="hero" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <ScrollReveal>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 text-secondary text-sm font-semibold mb-8 hover:text-primary transition-colors group"
            >
              <ArrowLeft
                size={16}
                className="group-hover:-translate-x-1 transition-transform duration-200"
              />
              Back to About
            </Link>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <span className="text-secondary text-sm font-semibold tracking-widest uppercase">
              Collaborations
            </span>
          </ScrollReveal>

          <ScrollReveal delay={160}>
            <h1 className="font-heading font-bold text-4xl lg:text-5xl text-primary mt-3 max-w-3xl">
              Partner Institutions
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={240}>
            <div className="w-20 h-1 bg-accent mt-4 rounded-full" />
          </ScrollReveal>

          <ScrollReveal delay={320}>
            <p className="mt-6 text-text-muted text-lg leading-relaxed max-w-2xl">
              BEI collaborates with leading educational institutions to provide students with
              diverse pathways and recognized credentials.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Partners Grid */}
      <section className="py-20 lg:py-28 relative">
        <FloatingShapes />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {loading ? (
            /* Skeleton placeholders */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-surface animate-pulse h-56"
                />
              ))}
            </div>
          ) : partners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Globe size={32} className="text-accent" />
              </div>
              <p className="text-primary font-heading font-semibold text-lg mb-2">
                No Partners Listed Yet
              </p>
              <p className="text-text-muted text-sm max-w-xs">
                Partner institutions will appear here once added by the administrator.
              </p>
            </div>
          ) : (
            <>
              {/* Count badge */}
              <ScrollReveal>
                <p className="text-sm text-text-muted mb-10 text-center">
                  Showing{" "}
                  <span className="font-semibold text-primary">{partners.length}</span>{" "}
                  active partner institution{partners.length !== 1 ? "s" : ""}
                </p>
              </ScrollReveal>

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {partners.map((partner, i) => (
                  <ScrollReveal key={partner.id} delay={i * 55}>
                    <div className="group flex flex-col items-center bg-surface border border-border rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-accent hover:-translate-y-1 transition-all duration-300 h-full cursor-default">
                      {/* Logo container */}
                      <div className="w-full h-36 flex items-center justify-center mb-5 rounded-xl bg-bg border border-border/50 overflow-hidden p-4 group-hover:border-accent/40 transition-colors duration-300">
                        <img
                          src={pb.files.getURL(partner, partner.logo)}
                          alt={partner.name}
                          className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                      </div>

                      {/* Divider */}
                      <div className="w-8 h-0.5 bg-accent/30 rounded-full mb-4 group-hover:w-12 group-hover:bg-accent transition-all duration-300" />

                      {/* Name */}
                      <p className="font-heading font-semibold text-sm text-primary text-center leading-snug group-hover:text-secondary transition-colors duration-300">
                        {partner.name}
                      </p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Partners;
