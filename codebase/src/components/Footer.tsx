import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  const socialLinks = [
    {
      name: "Facebook",
      url: "https://www.facebook.com/brilliantedu.institute",
      icon: "fa-brands fa-facebook",
      color: "#1877f2",
    },
    {
      name: "Telegram",
      url: "https://t.me/brillianteducationalinstitute",
      icon: "fa-brands fa-telegram",
      color: "#0088cc",
    },
    {
      name: "Email",
      url: "mailto:info@brilliant-edu.org",
      icon: "fa-solid fa-envelope",
      color: "#c9a227",
      isEmail: true,
    },
    {
      name: "YouTube",
      url: "https://www.youtube.com/@BEI-YouTube",
      icon: "fa-brands fa-youtube",
      color: "#ff0000",
    },
  ];

  return (
    <footer className="relative bg-primary text-white overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-secondary/10 animate-morph" />
        <div
          className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-sky/10 animate-morph"
          style={{ animationDelay: "3s" }}
        />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img
                src="/public_7d5c_unsub.png"
                alt="UN Sustainable Development Goals"
                className="w-full max-w-xs"
              />
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {["About", "Programs", "Admissions", "Services", "Contact"].map((l) => (
                <li key={l}>
                  <Link
                    to={`/${l.toLowerCase()}`}
                    className="text-sm text-white/70 hover:text-accent transition-colors inline-flex items-center gap-1 group"
                  >
                    <span className="w-0 group-hover:w-3 transition-all duration-300 overflow-hidden">
                      →
                    </span>
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">Departments</h4>
            <ul className="space-y-2.5">
              {[
                "Liberal Arts",
                "ICT & Technology",
                "Social Science",
                "Research & Development",
              ].map((p) => (
                <li key={p}>
                  <Link
                    to="/programs"
                    className="text-sm text-white/70 hover:text-accent transition-colors"
                  >
                    {p}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">Contact</h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li>
                <a 
                  href="mailto:info@brilliant-edu.org" 
                  className="hover:text-accent transition-colors"
                >
                  info@brilliant-edu.org
                </a>
              </li>
              <li>
                <a 
                  href="mailto:admission@brilliant-edu.org" 
                  className="hover:text-accent transition-colors"
                >admissions@brilliant-edu.org</a>
              </li>
              <li className="pt-2 text-white/50 text-xs">
                Online &amp; flexible learning available worldwide
              </li>
            </ul>
          </div>
        </div>

        {/* Social Media Bar */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target={social.isEmail ? undefined : "_blank"}
                rel={social.isEmail ? undefined : "noopener noreferrer"}
                className="flex flex-col items-center gap-2 group"
              >
                <div
                  className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center text-white/70 transition-all duration-300 group-hover:scale-110 group-hover:border-white"
                  style={
                    {
                      "--hover-color": social.color,
                    } as React.CSSProperties
                  }
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      social.color;
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      social.color + "20";
                    (e.currentTarget as HTMLElement).style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "rgba(255,255,255,0.2)";
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      "transparent";
                    (e.currentTarget as HTMLElement).style.color =
                      "rgba(255,255,255,0.7)";
                  }}
                >
                  <i className={`${social.icon} text-lg`}></i>
                </div>
                <span className="text-xs text-white/60 group-hover:text-white transition-colors">
                  {social.name}
                </span>
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-white/50">
          © {new Date().getFullYear()} Brilliant Educational Institute. A
          non-profit organization. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;