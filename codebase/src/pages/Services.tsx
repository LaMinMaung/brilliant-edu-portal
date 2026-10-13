import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Heart, Laptop, Users, MessageCircle, FileCheck } from "lucide-react";
import ScrollReveal from "../components/ScrollReveal";
import SectionHeading from "../components/SectionHeading";
import TiltCard from "../components/TiltCard";
import FloatingShapes from "../components/FloatingShapes";

const services = [
  {
    icon: <BookOpen size={28} />,
    title: "Academic Support",
    desc: "Personalized tutoring, study groups, and academic workshops to help you excel.",
    features: ["One-on-one tutoring", "Group study sessions", "Exam preparation workshops", "Progress tracking"],
  },
  {
    icon: <Heart size={28} />,
    title: "Student Counseling",
    desc: "Professional counseling services for academic journey and personal well-being.",
    features: ["Career guidance", "Academic advising", "Personal counseling", "University placement support"],
  },
  {
    icon: <Laptop size={28} />,
    title: "Online Learning (LMS)",
    desc: "Access course materials, assignments, and resources anytime through our online platform.",
    features: ["24/7 course access", "Interactive content", "Discussion forums", "Progress dashboards"],
  },
  {
    icon: <Users size={28} />,
    title: "Peer Mentoring",
    desc: "Connect with senior students and alumni for guidance and shared experiences.",
    features: ["Alumni network access", "Senior student mentors", "Study partnerships", "Networking events"],
  },
  {
    icon: <MessageCircle size={28} />,
    title: "Language Support",
    desc: "Additional language support including conversation practice and writing workshops.",
    features: ["Conversation clubs", "Writing workshops", "Cultural orientation", "Language labs"],
  },
  {
    icon: <FileCheck size={28} />,
    title: "Exam & Certification",
    desc: "Assistance with exam registration for GED, IELTS, TOEFL, and EnglishScore.",
    features: ["Registration guidance", "Deadline tracking", "British Council EnglishScore", "Documentation support"],
  },
];

const Services: React.FC = () => {
  return (
    <div>
      {/* Hero */}
      <section className="bg-surface border-b border-border relative overflow-hidden">
        <FloatingShapes variant="hero" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <ScrollReveal>
            <span className="text-secondary text-sm font-semibold tracking-widest uppercase">Student Services</span>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <h1 className="font-heading font-bold text-4xl lg:text-5xl text-primary mt-3 max-w-2xl">Supporting Your Every Step</h1>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="w-20 h-1 bg-accent mt-4 rounded-full" />
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <p className="mt-6 text-text-muted text-lg leading-relaxed max-w-2xl">
              Beyond academics, BEI provides comprehensive services to ensure every student has the support they need.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 lg:py-28 relative">
        <FloatingShapes />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading label="What We Offer" title="Comprehensive Student Support" subtitle="Our services complement your academic experience wherever you are learning from." />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <ScrollReveal key={s.title} delay={i * 100}>
                <TiltCard className="border border-border rounded-lg p-7 h-full flex flex-col bg-bg hover:border-accent transition-colors duration-300 group">
                  <div className="w-12 h-12 rounded-md bg-accent/10 text-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    {s.icon}
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-primary mb-2">{s.title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed mb-4 flex-1">{s.desc}</p>
                  <ul className="space-y-1.5 pt-4 border-t border-border">
                    {s.features.map((f) => (
                      <li key={f} className="text-xs text-text-muted flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </TiltCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 animate-gradient" style={{ background: "linear-gradient(135deg, #000080, #1d4ed8, #000080, #1d4ed8)" }} />
        <FloatingShapes variant="hero" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <ScrollReveal>
            <h2 className="font-heading font-bold text-3xl text-white mb-4">Need Assistance?</h2>
            <p className="text-white/70 max-w-lg mx-auto mb-8">
              Our student services team is here to support you. Reach out to learn how BEI can help you succeed.
            </p>
            <Link to="/contact" className="inline-block bg-white hover:bg-surface text-primary font-bold px-7 py-3 rounded-md transition-all duration-300 hover:scale-105">
              Get in Touch
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
};

export default Services;