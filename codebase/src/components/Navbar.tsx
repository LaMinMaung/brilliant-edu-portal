import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogIn, ChevronDown } from "lucide-react";
import pb from "../lib/pocketbase";

/* ── Types ─────────────────────────────────────────────────────── */
interface SubLink { to: string; label: string; }
interface NavLink {
  to: string;
  label: string;
  hasDropdown?: boolean;
  isDynamic?: boolean;   // true → use servicesSubLinks at render time
  subLinks?: SubLink[];
}

/* ── Static link definitions ──────────────────────────────────── */
const STATIC_LINKS: NavLink[] = [
  { to: "/", label: "Home" },
  {
    to: "/about",
    label: "About",
    hasDropdown: true,
    subLinks: [
      { to: "/about",        label: "About BEI & Collaborations" },
      { to: "/organization", label: "Organization Structure" },
    ],
  },
  { to: "/programs",   label: "Programs" },
  { to: "/admissions", label: "Admissions" },
  {
    to: "/services",
    label: "Services",
    hasDropdown: true,
    isDynamic: true,   // sub-links built dynamically from PocketBase
    subLinks: [],
  },
  { to: "/media-news", label: "Media & News" },
  { to: "/contact",    label: "Contact" },
];

const LOGIN_LINKS = [
  { to: "/login", label: "Portal Login", isExternal: false },
  { to: "https://study.brilliant-edu.org/login", label: "Campus Login", isExternal: true },
];

/* ── Component ─────────────────────────────────────────────────── */
const Navbar: React.FC = () => {
  const [open, setOpen]                   = useState(false);
  const [scrolled, setScrolled]           = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  /* Dynamic Services sub-links fetched from PocketBase */
  const [dynamicServices, setDynamicServices] = useState<SubLink[]>([]);

  const location             = useLocation();
  const logoRef              = useRef<HTMLAnchorElement>(null);
  const dropdownTimeout      = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Fetch published "Services" website resources ── */
  useEffect(() => {
    pb.collection("resources")
      .getFullList({
        filter: `(destination = "website" || destination = "both") && status = "published" && category = "Services"`,
        fields: "id,title,slug",
        sort: "created",
        requestKey: null,
      })
      .then(data =>
        setDynamicServices(
          (data as any[]).map(r => ({ to: `/resources/${r.slug}`, label: r.title }))
        )
      )
      .catch(() => {}); // fail silently — nav stays functional
  }, []);

  /* Services sub-links: static "Services" page first, dynamic resources after */
  const servicesSubLinks: SubLink[] = [
    { to: "/services", label: "Services" },
    ...dynamicServices,
  ];

  /* ── Resolve sub-links and active state per nav entry ── */
  const getSubLinks = (l: NavLink): SubLink[] =>
    l.isDynamic ? servicesSubLinks : (l.subLinks ?? []);

  const isAboutActive    = location.pathname === "/about" || location.pathname === "/organization";
  const isServicesActive = location.pathname === "/services" ||
    dynamicServices.some(r => location.pathname === r.to);

  const getIsActive = (l: NavLink): boolean => {
    if (l.label === "About")    return isAboutActive;
    if (l.label === "Services") return isServicesActive;
    return location.pathname === l.to;
  };

  /* ── Scroll listener ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Close on route change ── */
  useEffect(() => {
    setOpen(false);
    setActiveDropdown(null);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  /* ── Logo magnetic effect ── */
  useEffect(() => {
    const el = logoRef.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - rect.left - rect.width / 2) * 0.2}px, ${(e.clientY - rect.top - rect.height / 2) * 0.2}px)`;
    };
    const leave = () => { el.style.transform = "translate(0,0)"; };
    el.style.transition = "transform 0.3s cubic-bezier(0.16,1,0.3,1)";
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);
    return () => { el.removeEventListener("mousemove", move); el.removeEventListener("mouseleave", leave); };
  }, []);

  /* ── Dropdown hover helpers (same grace-period logic as About) ── */
  const handleDropdownEnter = (label: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setActiveDropdown(label);
  };
  const handleDropdownLeave = () => {
    dropdownTimeout.current = setTimeout(() => setActiveDropdown(null), 150);
  };

  /* ── Desktop dropdown renderer (shared by About and Services) ── */
  const renderDropdown = (l: NavLink) => {
    const subLinks = getSubLinks(l);
    const isActive = getIsActive(l);
    return (
      <div
        key={l.to}
        className="relative"
        onMouseEnter={() => handleDropdownEnter(l.label)}
        onMouseLeave={handleDropdownLeave}
      >
        <button className="relative text-sm xl:text-base font-medium transition-colors group whitespace-nowrap flex items-center gap-1">
          <span className={isActive ? "text-white font-semibold" : "text-white/75 hover:text-white"}>
            {l.label}
          </span>
          <ChevronDown
            size={16}
            className={`text-white/75 transition-transform ${activeDropdown === l.label ? "rotate-180" : ""}`}
          />
          <span
            className={`absolute -bottom-1 left-0 h-0.5 bg-accent transition-all duration-300 ${
              isActive ? "w-full" : "w-0 group-hover:w-full"
            }`}
          />
        </button>

        {activeDropdown === l.label && subLinks.length > 0 && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-primary border border-white/20 rounded-md shadow-xl overflow-hidden">
            {subLinks.map(sub => (
              <Link
                key={sub.to}
                to={sub.to}
                className={`block px-4 py-3 text-sm transition-colors ${
                  location.pathname === sub.to
                    ? "bg-white/15 text-white font-semibold"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                {sub.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-500 bg-primary ${scrolled ? "shadow-xl shadow-primary/30" : ""}`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-8">

          {/* Logo */}
          <Link ref={logoRef} to="/" className="flex items-center gap-3 shrink-0">
            <img
              src="/public_9434_d65151668d134695a02f5df6d68aeba8.png"
              alt="Brilliant Educational Institute Logo"
              className="h-12 w-auto"
            />
            <span className="font-heading font-semibold text-base xl:text-lg text-white whitespace-nowrap hidden xl:block">
              Brilliant Educational Institute
            </span>
          </Link>

          {/* ── Desktop nav ── */}
          <div className="hidden lg:flex items-center justify-center flex-1 gap-6 xl:gap-8">
            {STATIC_LINKS.map(l => {
              if (l.hasDropdown) return renderDropdown(l);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className="relative text-sm xl:text-base font-medium transition-colors group whitespace-nowrap"
                >
                  <span className={location.pathname === l.to ? "text-white font-semibold" : "text-white/75 hover:text-white"}>
                    {l.label}
                  </span>
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-accent transition-all duration-300 ${
                      location.pathname === l.to ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              );
            })}
          </div>

          {/* ── Desktop CTA ── */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {/* Login dropdown */}
            <div
              className="relative"
              onMouseEnter={() => handleDropdownEnter("Login")}
              onMouseLeave={handleDropdownLeave}
            >
              <button className="border-2 border-white/40 text-white hover:bg-white/15 hover:border-white text-sm xl:text-base font-semibold px-5 py-2 rounded-md transition-all duration-300 whitespace-nowrap inline-flex items-center gap-2">
                <LogIn size={16} />
                Login
                <ChevronDown size={16} className={`transition-transform ${activeDropdown === "Login" ? "rotate-180" : ""}`} />
              </button>
              {activeDropdown === "Login" && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-primary border border-white/20 rounded-md shadow-xl overflow-hidden">
                  {LOGIN_LINKS.map(link =>
                    link.isExternal ? (
                      <a key={link.to} href={link.to} target="_blank" rel="noopener noreferrer"
                        className="block px-4 py-3 text-sm text-white/75 hover:bg-white/10 hover:text-white transition-colors">
                        {link.label}
                      </a>
                    ) : (
                      <Link key={link.to} to={link.to}
                        className="block px-4 py-3 text-sm text-white/75 hover:bg-white/10 hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    )
                  )}
                </div>
              )}
            </div>

            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLScMTEA_EdoK7MokxUTZaaK27gGzoux82r0u9flZwxPePZPYiA/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-surface text-primary text-sm xl:text-base font-bold px-6 py-2.5 rounded-md transition-all duration-300 hover:scale-105 whitespace-nowrap inline-block"
            >
              Apply Now
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden p-2 text-white hover:text-white/80 transition-colors shrink-0"
            aria-label="Toggle menu"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {open && (
        <div className="lg:hidden border-t border-white/20 bg-primary">
          <div className="px-4 py-4 space-y-1">
            {STATIC_LINKS.map(l => {
              if (l.hasDropdown) {
                const subLinks = getSubLinks(l);
                return (
                  <div key={l.to}>
                    <div className="px-3 py-2 text-sm font-medium text-white/60">{l.label}</div>
                    <div className="ml-4 space-y-1">
                      {subLinks.map(sub => (
                        <Link
                          key={sub.to}
                          to={sub.to}
                          className={`block px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                            location.pathname === sub.to
                              ? "text-white bg-white/15 font-semibold"
                              : "text-white/75 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`block px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === l.to
                      ? "text-white bg-white/15 font-semibold"
                      : "text-white/75 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}

            {/* Mobile login section */}
            <div className="mt-3 pt-3 border-t border-white/20">
              <div className="px-3 py-2 text-sm font-medium text-white/60">Login</div>
              <div className="ml-4 space-y-1">
                {LOGIN_LINKS.map(link =>
                  link.isExternal ? (
                    <a key={link.to} href={link.to} target="_blank" rel="noopener noreferrer"
                      className="block px-3 py-2.5 rounded-md text-sm font-medium text-white/75 hover:text-white hover:bg-white/10 transition-colors">
                      {link.label}
                    </a>
                  ) : (
                    <Link key={link.to} to={link.to}
                      className="block px-3 py-2.5 rounded-md text-sm font-medium text-white/75 hover:text-white hover:bg-white/10 transition-colors">
                      {link.label}
                    </Link>
                  )
                )}
              </div>
            </div>

            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLScMTEA_EdoK7MokxUTZaaK27gGzoux82r0u9flZwxPePZPYiA/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-2 text-center bg-white hover:bg-surface text-primary text-sm font-bold px-5 py-2.5 rounded-md transition-colors"
            >
              Apply Now
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
