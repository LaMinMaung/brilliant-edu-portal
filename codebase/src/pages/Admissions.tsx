import React from "react";
import { Link } from "react-router-dom";
import {
  FileText, ClipboardList, UserCheck, GraduationCap,
  CheckCircle, ArrowRight, Mail,
} from "lucide-react";
import ScrollReveal from "../components/ScrollReveal";
import SectionHeading from "../components/SectionHeading";
import FloatingShapes from "../components/FloatingShapes";
import TiltCard from "../components/TiltCard";
import EditableBlock from "../components/EditableBlock";

/* ── Static data (icons + default copy) ────────────────────────── */
const steps = [
  {
    key: "step1",
    icon: <FileText size={26} />,
    defaultTitle: "Explore Our Programs",
    defaultDesc: "Browse BEI's available degrees, diplomas, and language programs to find the right fit for your academic goals and background.",
  },
  {
    key: "step2",
    icon: <ClipboardList size={26} />,
    defaultTitle: "Submit an Application",
    defaultDesc: "Complete and submit your application form with the required personal information and your choice of program.",
  },
  {
    key: "step3",
    icon: <UserCheck size={26} />,
    defaultTitle: "Document Review",
    defaultDesc: "Our admissions team reviews your documents and assesses your eligibility for the chosen program within 24–48 hours.",
  },
  {
    key: "step4",
    icon: <GraduationCap size={26} />,
    defaultTitle: "Enrollment & Orientation",
    defaultDesc: "Upon acceptance, complete enrollment, access the student portal, and attend online orientation to begin your studies.",
  },
];

const checklist = [
  "Copy of national identity card or passport",
  "Academic transcripts or certificates (high school or equivalent)",
  "Completed application form",
  "Statement of purpose or motivation letter",
  "Two recommendation letters (for degree programs)",
  "English proficiency proof (IELTS, TOEFL, or BEI placement assessment)",
];

const faqs = [
  {
    key: "faq1",
    defaultQ: "Is BEI accredited?",
    defaultA: "BEI is a non-profit higher education institute actively working toward formal accreditation. Our programs are recognised by partner institutions and designed to meet international academic standards.",
  },
  {
    key: "faq2",
    defaultQ: "How much does it cost to study at BEI?",
    defaultA: "BEI is committed to affordable education. Tuition fees vary by program. Financial support options are available for students who demonstrate need — contact us for details.",
  },
  {
    key: "faq3",
    defaultQ: "Can I apply if I am outside Myanmar?",
    defaultA: "Yes. BEI operates fully online and accepts applications from Myanmar students wherever they are located — inside or outside the country.",
  },
  {
    key: "faq4",
    defaultQ: "How long does the application review take?",
    defaultA: "Our admissions team typically reviews applications within 24–48 hours of receiving all required documents. You will be notified via email.",
  },
];

/* ── Page ─────────────────────────────────────────────────────── */
const Admissions: React.FC = () => (
  <div>

    {/* Hero */}
    <section className="bg-surface border-b border-border relative overflow-hidden">
      <FloatingShapes variant="hero" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">

        <ScrollReveal>
          <EditableBlock blockKey="hero_label" defaultValue="Admissions">
            {v => (
              <span className="text-secondary text-sm font-semibold tracking-widest uppercase">{v}</span>
            )}
          </EditableBlock>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <EditableBlock blockKey="hero_title" defaultValue="Join BEI — Education Without Barriers">
            {v => (
              <h1 className="font-heading font-bold text-4xl lg:text-5xl text-primary mt-3 max-w-2xl">{v}</h1>
            )}
          </EditableBlock>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="w-20 h-1 bg-accent mt-4 rounded-full" />
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <EditableBlock
            blockKey="hero_description"
            defaultValue="BEI welcomes motivated learners — especially those who have lost access to formal education — to apply for our programs. Our admissions process is transparent, supportive, and designed around your success."
            multiline
          >
            {v => (
              <p className="mt-6 text-text-muted text-lg leading-relaxed max-w-2xl">{v}</p>
            )}
          </EditableBlock>
        </ScrollReveal>

        <ScrollReveal delay={400}>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLScMTEA_EdoK7MokxUTZaaK27gGzoux82r0u9flZwxPePZPYiA/viewform"
              target="_blank" rel="noopener noreferrer"
              className="bg-primary hover:bg-primary-light text-white font-semibold px-7 py-3.5
                         rounded-md transition-all duration-300 inline-flex items-center gap-2 hover:scale-105"
            >
              Apply Now <ArrowRight size={18} />
            </a>
            <Link
              to="/contact"
              className="border-2 border-primary text-primary font-semibold px-7 py-3.5
                         rounded-md hover:bg-primary hover:text-white transition-all duration-300"
            >
              Contact Admissions
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>

    {/* Process */}
    <section className="py-20 lg:py-28 relative">
      <FloatingShapes />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Application Process"
          title="How to Apply"
          subtitle="Our four-step process is fully online — no in-person visits required."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <ScrollReveal key={step.key} delay={i * 120}>
              <TiltCard className="border border-border rounded-lg p-6 h-full flex flex-col bg-bg hover:border-accent transition-colors duration-300 group">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-md bg-accent/10 text-accent flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                    {step.icon}
                  </div>
                  <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                </div>
                <EditableBlock blockKey={`${step.key}_title`} defaultValue={step.defaultTitle}>
                  {v => (
                    <h3 className="font-heading font-semibold text-base text-primary mb-2">{v}</h3>
                  )}
                </EditableBlock>
                <EditableBlock blockKey={`${step.key}_desc`} defaultValue={step.defaultDesc} multiline>
                  {v => (
                    <p className="text-text-muted text-sm leading-relaxed flex-1">{v}</p>
                  )}
                </EditableBlock>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>

    {/* Requirements */}
    <section className="bg-surface border-y border-border py-20 lg:py-28 relative">
      <FloatingShapes />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            <EditableBlock blockKey="req_label" defaultValue="Requirements">
              {v => (
                <span className="text-secondary text-sm font-semibold tracking-widest uppercase">{v}</span>
              )}
            </EditableBlock>

            <EditableBlock blockKey="req_title" defaultValue="Documents & Requirements">
              {v => (
                <h2 className="font-heading font-bold text-3xl text-primary mt-3">{v}</h2>
              )}
            </EditableBlock>

            <div className="w-16 h-1 bg-accent mt-4 mb-4 rounded-full" />

            <EditableBlock
              blockKey="req_description"
              defaultValue="The following documents are required for your application. Please prepare digital copies of each item before submitting the form."
              multiline
            >
              {v => (
                <p className="text-text-muted leading-relaxed mb-8">{v}</p>
              )}
            </EditableBlock>
          </ScrollReveal>

          <div className="space-y-3">
            {checklist.map((item, i) => (
              <ScrollReveal key={i} delay={i * 60}>
                <div className="flex items-start gap-3 p-4 bg-bg border border-border rounded-lg hover:border-accent transition-colors duration-300">
                  <CheckCircle size={17} className="text-accent shrink-0 mt-0.5" />
                  <p className="text-text text-sm leading-relaxed">{item}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* FAQ */}
    <section className="py-20 lg:py-28 relative">
      <FloatingShapes />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading label="FAQ" title="Common Questions" />
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, i) => (
            <ScrollReveal key={faq.key} delay={i * 80}>
              <TiltCard className="border border-border rounded-lg p-6 bg-bg hover:border-accent transition-colors duration-300" intensity={3}>
                <EditableBlock blockKey={`${faq.key}_q`} defaultValue={faq.defaultQ}>
                  {v => (
                    <h3 className="font-heading font-semibold text-primary text-base mb-2">{v}</h3>
                  )}
                </EditableBlock>
                <EditableBlock blockKey={`${faq.key}_a`} defaultValue={faq.defaultA} multiline>
                  {v => (
                    <p className="text-text-muted text-sm leading-relaxed">{v}</p>
                  )}
                </EditableBlock>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="bg-surface border-t border-border py-20 lg:py-28 relative overflow-hidden">
      <FloatingShapes />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <ScrollReveal>
          <EditableBlock blockKey="cta_title" defaultValue="Ready to Start Your Journey?">
            {v => (
              <h2 className="font-heading font-bold text-3xl lg:text-4xl text-primary mb-4">{v}</h2>
            )}
          </EditableBlock>

          <EditableBlock
            blockKey="cta_description"
            defaultValue="Applications are open year-round. Join hundreds of Myanmar students who are building their futures through accessible, quality education at BEI."
            multiline
          >
            {v => (
              <p className="text-text-muted text-lg leading-relaxed max-w-2xl mx-auto mb-8">{v}</p>
            )}
          </EditableBlock>

          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLScMTEA_EdoK7MokxUTZaaK27gGzoux82r0u9flZwxPePZPYiA/viewform"
              target="_blank" rel="noopener noreferrer"
              className="bg-primary hover:bg-primary-light text-white font-semibold px-7 py-3.5
                         rounded-md transition-all duration-300 inline-flex items-center gap-2 hover:scale-105"
            >
              Apply Now <ArrowRight size={18} />
            </a>
            <Link
              to="/contact"
              className="border-2 border-border text-primary font-semibold px-7 py-3.5
                         rounded-md hover:border-primary transition-all duration-300 inline-flex items-center gap-2"
            >
              <Mail size={18} /> Contact Admissions
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>

  </div>
);

export default Admissions;
