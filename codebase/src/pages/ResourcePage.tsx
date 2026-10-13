import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Download, ChevronRight, BookOpen, AlertCircle } from "lucide-react";
import pb from "../lib/pocketbase";
import ScrollReveal from "../components/ScrollReveal";
import FloatingShapes from "../components/FloatingShapes";

const ResourcePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return; }

    pb.collection("resources")
      .getFirstListItem(
        pb.filter(
          `slug = {:slug} && (destination = "website" || destination = "both") && status = "published"`,
          { slug }
        ),
        { requestKey: null }
      )
      .then(data => setResource(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ── Not found ── */
  if (notFound || !resource) {
    return (
      <section className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-20">
        <AlertCircle size={52} className="text-text-muted/30 mb-4" />
        <h1 className="font-heading font-bold text-2xl text-primary mb-2">Resource Not Found</h1>
        <p className="text-text-muted mb-6 max-w-sm">
          This resource may not be published yet or the link may be incorrect.
        </p>
        <Link
          to="/"
          className="bg-primary text-white font-semibold px-6 py-2.5 rounded-md hover:bg-primary/90 transition-colors"
        >
          Go Home
        </Link>
      </section>
    );
  }

  const fileUrl = pb.files.getURL(resource, resource.file);

  return (
    <div>
      {/* ── Page header ───────────────────────────────────────── */}
      <section className="bg-surface border-b border-border relative overflow-hidden">
        <FloatingShapes variant="hero" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">

          {/* Breadcrumb */}
          <ScrollReveal>
            <nav className="flex items-center flex-wrap gap-1.5 text-xs text-text-muted mb-5">
              <Link to="/" className="hover:text-primary transition-colors">Home</Link>
              {resource.category && (
                <>
                  <ChevronRight size={11} className="text-text-muted/50" />
                  <span>{resource.category}</span>
                </>
              )}
              <ChevronRight size={11} className="text-text-muted/50" />
              <span className="text-primary font-medium">{resource.title}</span>
            </nav>
          </ScrollReveal>

          {resource.category && (
            <ScrollReveal delay={50}>
              <span className="text-secondary text-sm font-semibold tracking-widest uppercase">
                {resource.category}
              </span>
            </ScrollReveal>
          )}

          <ScrollReveal delay={100}>
            <h1 className="font-heading font-bold text-3xl lg:text-4xl text-primary mt-2 max-w-3xl leading-tight">
              {resource.title}
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <div className="w-16 h-1 bg-accent mt-4 rounded-full" />
          </ScrollReveal>

          {resource.description && (
            <ScrollReveal delay={200}>
              <p className="mt-5 text-text-muted text-lg leading-relaxed max-w-2xl">
                {resource.description}
              </p>
            </ScrollReveal>
          )}

          <ScrollReveal delay={250}>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 border border-border text-primary font-semibold px-5 py-2.5 rounded-md hover:border-primary hover:bg-primary hover:text-white transition-all duration-200 text-sm"
            >
              <Download size={15} /> Download PDF
            </a>
          </ScrollReveal>
        </div>
      </section>

      {/* ── PDF Viewer ────────────────────────────────────────── */}
      <section className="py-10 lg:py-14 bg-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl overflow-hidden border border-border shadow-sm bg-surface">
            <iframe
              src={fileUrl}
              title={resource.title}
              className="w-full border-0 block"
              style={{ height: "82vh", minHeight: "640px" }}
            >
              {/* Fallback for browsers without native PDF viewer */}
              <div className="flex flex-col items-center justify-center p-12 bg-surface text-center min-h-[400px]">
                <BookOpen size={48} className="text-text-muted/25 mb-4" />
                <p className="text-primary font-semibold mb-2">
                  PDF preview is not available in your browser.
                </p>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-md hover:bg-primary/90 transition-colors text-sm mt-2"
                >
                  <Download size={14} /> Open PDF
                </a>
              </div>
            </iframe>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-text-muted mt-4">
            Having trouble viewing?{" "}
            <a href={fileUrl} target="_blank" rel="noopener noreferrer"
              className="text-primary underline hover:no-underline">
              Open in a new tab
            </a>
          </p>
        </div>
      </section>
    </div>
  );
};

export default ResourcePage;
