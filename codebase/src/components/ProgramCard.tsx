import React from "react";
import { Clock, BookOpen, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TiltCard from "./TiltCard";

export interface Program {
  id: string;
  title: string;
  category: "diploma" | "undergraduate" | "graduate" | "online";
  description: string;
  duration: string;
  credits: string;
  tags: string[];
  image?: string;
  comingSoon?: boolean;
  applyFormLink?: string;
}

interface Props {
  program: Program;
  index: number;
}

const categoryColors: Record<string, { bg: string; text: string; label: string }> = {
  diploma:       { bg: "bg-sky/15 border-sky/30",           text: "text-sky",       label: "Diploma" },
  undergraduate: { bg: "bg-secondary/15 border-secondary/30", text: "text-secondary", label: "Undergraduate" },
  graduate:      { bg: "bg-accent/15 border-accent/30",     text: "text-primary",   label: "Graduate" },
  online:        { bg: "bg-green-100 border-green-300",      text: "text-green-700", label: "Online" },
};

const ProgramCard: React.FC<Props> = ({ program, index }) => {
  const cat = categoryColors[program.category];
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/programs/${program.id}`);
  };

  return (
    <div
      className="opacity-0 animate-[fadeUp_0.5s_ease_forwards] cursor-pointer"
      style={{ animationDelay: `${index * 80}ms` }}
      onClick={handleCardClick}
    >
      <TiltCard
        className={`border border-border rounded-lg overflow-hidden bg-bg h-full flex flex-col group hover:border-accent transition-colors duration-300 ${
          program.comingSoon ? "opacity-75" : ""
        }`}
        intensity={5}
      >
        {/* Image area */}
        <div className="relative h-44 bg-surface flex items-center justify-center overflow-hidden">
          {program.image ? (
            <img
              src={program.image}
              alt={program.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-text-muted/40">
              <BookOpen size={40} />
              <span className="text-xs">Program Image</span>
            </div>
          )}
          {/* Category badge */}
          <span
            className={`absolute top-3 left-3 text-xs font-semibold px-3 py-1 rounded-full border ${cat.bg} ${cat.text}`}
          >
            {cat.label}
          </span>
          {program.comingSoon && (
            <span className="absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full bg-accent text-primary">
              Coming Soon
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-1">
          <h3 className="font-heading font-bold text-lg text-primary mb-2 leading-snug">
            {program.title}
          </h3>
          <p className="text-text-muted text-sm leading-relaxed mb-4 flex-1">
            {program.description}
          </p>

          {/* Duration & Credits */}
          <div className="flex items-center gap-4 text-xs text-text-muted mb-4">
            <span className="flex items-center gap-1.5">
              <Clock size={13} className="text-secondary" />
              {program.duration}
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen size={13} className="text-secondary" />
              {program.credits}
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {program.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2.5 py-0.5 rounded-full bg-surface border border-border text-text-muted"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* See More indicator */}
          <div className="flex items-center justify-end mt-auto">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-text-muted group-hover:text-primary transition-colors duration-300">
              See More
              <span className="w-7 h-7 rounded-md border border-border group-hover:border-primary flex items-center justify-center transition-colors duration-300">
                <ArrowRight size={14} />
              </span>
            </span>
          </div>
        </div>
      </TiltCard>
    </div>
  );
};

export default ProgramCard;
