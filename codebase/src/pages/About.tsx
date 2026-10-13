import React from "react";
import { Target, Eye, Lightbulb, Heart, Users, Shield, Zap, BookOpen, Globe } from "lucide-react";
import ScrollReveal from "../components/ScrollReveal";
import SectionHeading from "../components/SectionHeading";
import TiltCard from "../components/TiltCard";
import FloatingShapes from "../components/FloatingShapes";

const About: React.FC = () => {

  const visionPoints = [
    "To establish an internationally recognized higher education institution that equips Myanmar youth with vital knowledge, skills, and values to create their futures and achieve their dreams.",
    "To achieve global recognition as a university that provides accessible, high-quality education to all learners at any time and in any location by collaborating with national and international partners, research institutions, and industries.",
  ];

  const missionPoints = [
    "To develop a generation of youth equipped with global knowledge and skills for academic and professional development.",
    "To advance research and innovation that benefits society and expands the field of knowledge.",
    "To promote lifelong learning that empowers individuals to adapt and succeed in a constantly evolving environment.",
    "To foster responsible, ethical, and innovative individuals equipped with the enthusiasm and leadership necessary for promoting sustainable national growth.",
    "To create critical thinkers and problem-solvers capable of making significant contributions to the establishment of a contemporary federal democratic nation.",
  ];

  const brilliantValues = [
    {
      letter: "B",
      title: "Belonging & Equity",
      description: "Promoting inclusion, respect, and equal opportunities for all learners regardless of race, gender, religion, and socio-economic status.",
      icon: <Users size={24} />,
    },
    {
      letter: "R",
      title: "Responsibility & Integrity",
      description: "Upholding ethical conduct, accountability, and transparency in all academic and administrative practices.",
      icon: <Shield size={24} />,
    },
    {
      letter: "I",
      title: "Innovation with Purpose",
      description: "Encouraging responsible creativity and innovation to address educational and social needs.",
      icon: <Zap size={24} />,
    },
    {
      letter: "L",
      title: "Lifelong Learning",
      description: "Supporting continuous learning and personal development throughout life.",
      icon: <BookOpen size={24} />,
    },
    {
      letter: "L",
      title: "Leadership for Society",
      description: "Developing ethical leaders committed to positive community and social impact.",
      icon: <Target size={24} />,
    },
    {
      letter: "I",
      title: "Inclusive & Safe Learning Environment",
      description: "Ensuring a secure, inclusive, and learner-centered educational environment.",
      icon: <Heart size={24} />,
    },
    {
      letter: "A",
      title: "Accessibility & Quality",
      description: "Providing flexible, accessible, and high-quality education for diverse learners.",
      icon: <Eye size={24} />,
    },
    {
      letter: "N",
      title: "National & Global Engagement",
      description: "Collaborating with national and international partners in education and research.",
      icon: <Globe size={24} />,
    },
    {
      letter: "T",
      title: "Transformative & Sustainable Impact",
      description: "Committing to long-term educational quality, sustainability, and meaningful social transformation.",
      icon: <Lightbulb size={24} />,
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-surface border-b border-border relative overflow-hidden">
        <FloatingShapes variant="hero" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <ScrollReveal>
            <span className="text-secondary text-sm font-semibold tracking-widest uppercase">
              About BEI
            </span>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <h1 className="font-heading font-bold text-4xl lg:text-5xl text-primary mt-3 max-w-2xl">
              Education Without Barriers
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="w-20 h-1 bg-accent mt-4 rounded-full" />
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <p className="mt-6 text-text-muted text-lg leading-relaxed max-w-2xl">
              Brilliant Educational Institute is a non-profit organization
              dedicated to providing accessible, affordable education to Myanmar
              students — especially those who have lost access to formal schooling.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 lg:py-28 relative">
        <FloatingShapes />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="max-w-4xl mx-auto">
              <h2 className="font-heading font-bold text-3xl text-primary mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-text-muted leading-relaxed">
                <p>
                  The Brilliant Educational Institute (BEI) is a non-profit higher education and professional 
                  training institution dedicated to expanding access to quality education for Myanmar students who 
                  have lost access to formal learning opportunities within their own country. Established by a 
                  collective of passionate educators committed to social transformation, BEI aims to empower future 
                  generations through inclusive, high-quality educational programs.
                </p>
                <p>
                  BEI was initially founded in 2023 as the Brilliant Education Center, operating primarily through 
                  online platforms and social networks to provide affordable English language education. During its 
                  early stage, the center focused on English proficiency courses ranging from elementary to 
                  academic preparation levels. Within its first two years of operation, the initiative supported more 
                  than 1,000 learners, helping them improve their language skills and prepare for further academic 
                  and career opportunities.
                </p>
                <p>
                  As the number of vulnerable learners increased and their educational needs diversified, BEI 
                  recognized the need to expand beyond language training. Consequently, the institution transitioned 
                  from a language education center into a broader vocational and higher education institute, 
                  offering structured academic pathways and skills-oriented programs.
                </p>
                <p>
                  Today, BEI offers a range of academic programs, including Diploma, Associate, Bachelor's, and 
                  Master's degree programs, designed to provide accessible higher education opportunities for 
                  learners affected by educational disruption. In addition, BEI has established a Language Testing 
                  Centre, which provides support for internationally recognized English proficiency assessments 
                  and CEFR-aligned diagnostic evaluations to help students measure and improve their language 
                  proficiency for academic and professional purposes.
                </p>
                <p>
                  Through these initiatives, BEI aims to build an inclusive educational ecosystem that enables 
                  Myanmar youth to continue their studies, develop professional competencies, and connect with 
                  regional and international academic opportunities.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Vision Statement */}
      <section className="bg-surface border-y border-border py-20 lg:py-28 relative">
        <FloatingShapes />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="Our Vision"
            title="Building Futures Through Education"
          />
          <div className="max-w-4xl mx-auto space-y-6">
            {visionPoints.map((point, i) => (
              <ScrollReveal key={i} delay={i * 120}>
                <div className="flex items-start gap-4 p-6 bg-bg border border-border rounded-lg hover:border-accent transition-colors duration-300">
                  <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0 font-heading font-bold">
                    {i + 1}
                  </div>
                  <p className="text-text leading-relaxed">{point}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-20 lg:py-28 relative">
        <FloatingShapes />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="Our Mission"
            title="Empowering Myanmar's Future Leaders"
          />
          <div className="max-w-4xl mx-auto space-y-4">
            {missionPoints.map((point, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div className="flex items-start gap-4 p-5 bg-surface border border-border rounded-lg hover:border-secondary transition-colors duration-300">
                  <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0 text-xs font-bold">
                    {String.fromCharCode(97 + i)}
                  </div>
                  <p className="text-text leading-relaxed text-sm">{point}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* BRILLIANT Framework */}
      <section className="bg-surface border-y border-border py-20 lg:py-28 relative">
        <FloatingShapes />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="Core Values"
            title="The BRILLIANT Framework"
            subtitle="Our commitment to excellence, integrity, and transformative education is embodied in these foundational principles."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brilliantValues.map((value, i) => (
              <ScrollReveal key={value.letter} delay={i * 100}>
                <TiltCard className="bg-bg border border-border rounded-lg p-6 h-full group hover:border-accent transition-colors duration-300">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-md bg-accent/10 text-accent flex items-center justify-center shrink-0 font-heading font-bold text-xl">
                      {value.letter}
                    </div>
                    <div className="w-10 h-10 rounded-md bg-secondary/10 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      {value.icon}
                    </div>
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-primary mb-3">
                    {value.title}
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    {value.description}
                  </p>
                </TiltCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;