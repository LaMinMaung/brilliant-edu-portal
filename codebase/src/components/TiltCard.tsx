import React from "react";
import { use3DTilt } from "../hooks/use3DTilt";

interface Props {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

const TiltCard: React.FC<Props> = ({ children, className = "", intensity = 8 }) => {
  const tiltRef = use3DTilt(intensity);

  return (
    <div ref={tiltRef} className={className} style={{ transformStyle: "preserve-3d" }}>
      {children}
    </div>
  );
};

export default TiltCard;