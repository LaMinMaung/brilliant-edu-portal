import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Globe,
  BookOpen,
  Monitor,
  Award,
  Users,
  TrendingUp,
  Heart,
  ArrowRight,
} from "lucide-react";
import ScrollReveal from "../components/ScrollReveal";
import GalleryStrip from "../components/GalleryStrip";
import SectionHeading from "../components/SectionHeading";
import ParticleSystem from "../components/ParticleSystem";
import FloatingShapes from "../components/FloatingShapes";
import TiltCard from "../components/TiltCard";
import { useParallax } from "../hooks/useParallax";
import pb from "../lib/pocketbase";

const programs = [
  {
    icon: <GraduationCap size={28} />,
    title: "GED Preparation",
    desc: "Comprehensive high school equivalency program helping Myanmar students earn credentials for university admission worldwide.",
  },
  {
    icon: <Globe size={28} />,
    title: "IELTS & TOEFL Training",
    desc: "Structured English proficiency training with practice tests, personalized feedback, and British Council EnglishScore certification.",
  },
  {
    icon: <BookOpen size={28} />,
    title: "Language Programs",
    desc: "English, Burmese, and Japanese language courses designed for communication, academic, and career readiness.",
  },
  {
    icon: <Monitor size={28} />,
    title: "ICT & Technology",
    desc: "Industry-aligned courses in HTML, CSS, JavaScript, Python, React, and Java — building real-world tech skills.",
  },
];

const reasons = [
  {
    icon: <Heart size={24} />,
    title: "Non-Profit Mission",
    desc: "We exist to serve disadvantaged and displaced Myanmar learners with accessible, affordable education.",
  },
  {
    icon: <Users size={24} />,
    title: "Expert Faculty",
    desc: "Learn from dedicated educators committed to developing skilled, knowledgeable, and ethical young leaders.",
  },
  {
    icon: <TrendingUp size={24} />,
    title: "Recognized Pathways",
    desc: "Partner university credit transfers, British Council certification, and diploma-to-bachelor pathways.",
  },
  {
    icon: <Award size={24} />,
    title: "Flexible Learning",
    desc: "Online and flexible schedules so students can learn from anywhere, anytime — no matter their circumstances.",
  },
];

const stats = [
  { value: "500+", label: "Students Per Year" },
  { value: "4", label: "Departments" },
  { value: "Since 2023", label: "Serving Learners" },
  { value: "3", label: "Languages Offered" },
];

const Home: React.FC = () => {
  const parallaxOffset = useParallax(0.3);
  const sdgParallax = useParallax(0.15);
  const [partners, setPartners] = useState<any[]>([]);

  useEffect(() => {
    pb.collection("collaborators")
      .getFullList({
        filter: 'status = "active"',
        sort: "displayOrder,name",
        requestKey: null,
      })
      .then((data) => setPartners(data))
      .catch((err) => console.error("Failed to load partners:", err));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Parallax background */}
        <div
          className="absolute inset-0"
          style={{ transform: `translateY(${parallaxOffset}px)` }}
        >
          <img
            src="/public_a9b9_84649cfa7e3c4016adc3a1ef0da3c19b.jpeg"
            alt="BEI students learning online"
            className="w-full h-[120%] object-cover opacity-10"
          />
        </div>

        {/* SDG Goals Background */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ transform: `translateY(${sdgParallax}px)` }}
        >
          <img
            src="/public_e6c6_118b6f3c1e4843269cf06931e166c0d1.png"
            alt="UN Sustainable Development Goals"
            className="w-full max-w-4xl opacity-[0.08] animate-pulse-slow"
            style={{
              mixBlendMode: "multiply",
            }}
          />
        </div>

        <ParticleSystem />
        <FloatingShapes variant="hero" />

        {/* Ghost watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <span
            className="font-heading font-bold text-[20vw] leading-none text-primary/[0.03] select-none"
          >
            BEI
          </span>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 w-full">
          <div className="max-w-3xl mx-auto text-center">
            <ScrollReveal>
              <span className="inline-block text-secondary text-sm font-semibold tracking-widest uppercase mb-4">
                Brilliant Educational Institute
              </span>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-7xl text-primary leading-tight">
                Education for
                <br />
                <span
                  className="text-transparent bg-clip-text animate-shimmer"
                  style={{
                    backgroundImage: "linear-gradient(90deg, #22d3ee, #e0f2fe, #22d3ee)",
                    backgroundSize: "200% auto",
                  }}
                >
                  Every
                </span>{" "}
                Learner
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={400}>
              <p className="mt-6 text-text-muted text-lg leading-relaxed max-w-xl mx-auto">
                A non-profit institute dedicated to helping Myanmar students —
                especially those who have lost access to formal education — build
                knowledge, skills, and futures through quality programs online.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={600}>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  to="/programs"
                  className="bg-primary hover:bg-primary-light text-white font-semibold px-7 py-3.5 rounded-md transition-all duration-300 inline-flex items-center gap-2 hover:scale-105 hover:gap-3"
                >
                  Explore Programs <ArrowRight size={18} />
                </Link>
                <Link
                  to="/about"
                  className="border-2 border-primary text-primary font-semibold px-7 py-3.5 rounded-md hover:bg-primary hover:text-white transition-all duration-300"
                >
                  Learn More
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border relative">
        <FloatingShapes />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <ScrollReveal key={s.label} delay={i * 100} className="text-center">
                <TiltCard className="p-4" intensity={5}>
                  <div className="font-heading font-bold text-3xl lg:text-4xl text-primary">
                    {s.value}
                  </div>
                  <div className="text-text-muted text-sm mt-1">{s.label}</div>
                </TiltCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-20 lg:py-28 relative">
        <FloatingShapes />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="Our Programs"
            title="Academic & Skills Programs"
            subtitle="From international exam preparation to tech courses and language training, we offer programs designed to open doors for Myanmar students."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {programs.map((p, i) => (
              <ScrollReveal key={p.title} delay={i * 120}>
                <TiltCard
                  className="border border-border rounded-lg p-6 h-full flex flex-col bg-bg hover:border-accent transition-colors duration-300 group"
                >
                  <div className="w-12 h-12 rounded-md bg-surface text-secondary flex items-center justify-center mb-4 group-hover:bg-accent/10 group-hover:text-accent transition-colors duration-300">
                    {p.icon}
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-primary mb-2">
                    {p.title}
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed flex-1">
                    {p.desc}
                  </p>
                  <Link
                    to="/programs"
                    className="mt-4 text-secondary text-sm font-medium inline-flex items-center gap-1 hover:text-primary hover:gap-2 transition-all duration-300"
                  >
                    Learn More <ArrowRight size={14} />
                  </Link>
                  {/* Accent line */}
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-500 rounded-b-lg" />
                </TiltCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-surface border-y border-border py-20 lg:py-28 relative">
        <FloatingShapes />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="Why Choose BEI"
            title="Accessible, Quality Education"
            subtitle="We believe every student deserves the chance to learn, grow, and succeed — regardless of their circumstances."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {reasons.map((r, i) => (
              <ScrollReveal key={r.title} delay={i * 120}>
                <TiltCard className="bg-bg border border-border rounded-lg p-8 text-center h-full group hover:border-accent transition-colors duration-300">
                  <div className="w-14 h-14 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                    {r.icon}
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-primary mb-3">
                    {r.title}
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed">{r.desc}</p>
                </TiltCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="py-20 lg:py-28 relative">
        <FloatingShapes />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="Our Departments"
            title="Four Pillars of Learning"
            subtitle="BEI is structured across four departments, each dedicated to a core area of knowledge and skill development."
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { img: "/public_4792_82206f61baf24677ab5d722505732a5c.jpeg", name: "Liberal Arts" },
              { img: "/public_bfbe_9ff2f6bfd44d42768658e245a4d0ef94.png", name: "ICT Department" },
              { img: "/public_ac08_b840f546f2b54a4286762e74a3958f34.png", name: "Social Science" },
              { img: "/public_9f21_77c24b70663b45b493dbab555747d39b.jpeg", name: "Research & Development" },
            ].map((dept, i) => (
              <ScrollReveal key={dept.name} delay={i * 100} direction="scale">
                <Link to="/programs" className="block group">
                  <TiltCard className="border border-border rounded-lg p-6 text-center hover:border-accent transition-all duration-300 h-full bg-bg">
                    <div className="w-full aspect-square flex items-center justify-center mb-4">
                      <img
                        src={dept.img}
                        alt={dept.name}
                        className="max-h-28 w-auto object-contain group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                     <h3 className="font-heading font-semibold text-sm text-primary group-hover:text-secondary transition-colors duration-300">
                      {dept.name}
                    </h3>
                  </TiltCard>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-surface border-y border-border py-20 lg:py-28 relative">
        <FloatingShapes />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="Student Voices"
            title="Making a Difference"
            subtitle="Hear from students whose lives have been changed through access to quality education at BEI."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "After losing access to my university, BEI gave me a second chance. I'm now preparing for my GED and planning to study abroad.",
                name: "Thida A.",
                program: "GED Preparation Student",
              },
              {
                quote: "The IELTS training and British Council EnglishScore certification helped me secure a scholarship opportunity I never thought possible.",
                name: "Min K.",
                program: "IELTS Band 7.5",
              },
              {
                quote: "Learning web development at BEI opened doors to freelance work. The ICT department truly cares about practical, real-world skills.",
                name: "Su M.",
                program: "ICT Department Graduate",
              },
            ].map((t, i) => (
              <ScrollReveal key={t.name} delay={i * 150}>
                <TiltCard className="bg-bg border border-border rounded-lg p-8 h-full flex flex-col group hover:border-secondary transition-colors duration-300" intensity={5}>
                  <div className="text-accent text-3xl font-heading mb-3">&ldquo;</div>
                  <p className="text-text-muted text-sm leading-relaxed italic flex-1">
                    {t.quote}
                  </p>
                  <div className="mt-6 pt-4 border-t border-border">
                    <div className="font-semibold text-primary text-sm">{t.name}</div>
                    <div className="text-text-muted text-xs mt-0.5">{t.program}</div>
                  </div>
                </TiltCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery — auto-hides when no active items */}
      <GalleryStrip />

      {/* Partner Institutions */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <FloatingShapes />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="Collaborations"
            title="Partner Institutions"
            subtitle="BEI collaborates with leading educational institutions to provide students with diverse pathways and recognized credentials."
          />

          {/* Auto-scrolling logo carousel */}
          <ScrollReveal>
            {partners.length === 0 ? (
              <div className="py-8 text-center text-text-muted text-sm">
                Partner institutions will appear here once added by the admin.
              </div>
            ) : (
              <div className="relative">
                <div className="overflow-hidden py-8">
                  <div className="flex animate-[scroll_30s_linear_infinite] hover:[animation-play-state:paused]">
                    {/* First set */}
                    {partners.map((partner, i) => (
                      <div
                        key={`first-${i}`}
                        className="flex-shrink-0 w-48 h-32 mx-6 flex items-center justify-center group"
                      >
                        <div className="relative w-full h-full flex items-center justify-center p-4 bg-surface border border-border rounded-lg transition-all duration-300 group-hover:border-accent group-hover:shadow-lg">
                          <img
                            src={pb.files.getURL(partner, partner.logo)}
                            alt={partner.name}
                            className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    ))}
                    {/* Duplicate set for seamless loop */}
                    {partners.map((partner, i) => (
                      <div
                        key={`second-${i}`}
                        className="flex-shrink-0 w-48 h-32 mx-6 flex items-center justify-center group"
                      >
                        <div className="relative w-full h-full flex items-center justify-center p-4 bg-surface border border-border rounded-lg transition-all duration-300 group-hover:border-accent group-hover:shadow-lg">
                          <img
                            src={pb.files.getURL(partner, partner.logo)}
                            alt={partner.name}
                            className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gradient overlays for fade effect */}
                <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-bg to-transparent pointer-events-none" />
                <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-bg to-transparent pointer-events-none" />
              </div>
            )}
          </ScrollReveal>

          {/* Link to full partners page */}
          {partners.length > 0 && (
            <ScrollReveal delay={80}>
              <div className="flex justify-center mt-8 mb-4">
                <Link
                  to="/about/partners"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-primary border border-secondary/30 hover:border-primary/50 px-6 py-3 rounded-full transition-all duration-300 hover:shadow-md group"
                >
                  All Collaboration Partners
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </div>
            </ScrollReveal>
          )}

          {/* Partner categories */}
          <ScrollReveal delay={150}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-12">
              <TiltCard className="border border-border rounded-lg p-8 h-full group hover:border-sky transition-colors duration-300" intensity={5}>
                <h3 className="font-heading font-semibold text-lg text-primary mb-3">
                  Educational Institutions
                </h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  We collaborate with schools and universities across Myanmar to expand
                  access to quality education and provide credit transfer pathways for students.
                </p>
              </TiltCard>
              <TiltCard className="border border-border rounded-lg p-8 h-full group hover:border-sky transition-colors duration-300" intensity={5}>
                <h3 className="font-heading font-semibold text-lg text-primary mb-3">
                  British Council EnglishScore
                </h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  BEI collaborates with the British Council EnglishScore test to offer
                  internationally recognized English certification — useful for
                  admissions, jobs, and scholarships.
                </p>
              </TiltCard>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 animate-gradient"
          style={{ background: "linear-gradient(135deg, #000080, #1d4ed8, #000080, #1d4ed8)" }}
        />
        <FloatingShapes variant="hero" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <ScrollReveal>
            <h2 className="font-heading font-bold text-3xl lg:text-4xl text-white">
              Ready to Start Learning?
            </h2>
            <p className="mt-4 text-white/70 max-w-xl mx-auto">
              Join hundreds of Myanmar students building their futures through
              accessible, quality education. Apply today or reach out to learn more.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLScMTEA_EdoK7MokxUTZaaK27gGzoux82r0u9flZwxPePZPYiA/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-surface text-primary font-bold px-7 py-3 rounded-md transition-all duration-300 hover:scale-105"
              >
                Apply Now
              </a>
              <Link
                to="/contact"
                className="border-2 border-white/30 text-white font-semibold px-7 py-3 rounded-md hover:bg-white/10 transition-all duration-300"
              >
                Contact Us
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
};

export default Home;