import React, { useState } from "react";
import { Mail, Phone, Globe, Send } from "lucide-react";
import ScrollReveal from "../components/ScrollReveal";
import FloatingShapes from "../components/FloatingShapes";

declare global {
  interface Window {
    sgpowcaptcha: {
      PoWSolver: new () => { start: (challenge: string) => Promise<string> };
    };
  }
}

const Contact: React.FC = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    try {
      await new Promise<void>((resolve, reject) => {
        if (window.sgpowcaptcha) return resolve();
        const script = document.createElement("script");
        script.src = "/sgcaptcha/solver.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load captcha solver"));
        document.head.appendChild(script);
      });

      const challengeRes = await fetch("/sgcaptcha/challenge");
      const challenge = await challengeRes.text();
      const pow = new window.sgpowcaptcha.PoWSolver();
      const solution = await pow.start(challenge);

      const fd = new FormData();
      fd.append(
        "message",
        `Name: ${form.name}\nEmail: ${form.email}\nSubject: ${form.subject}\n\n${form.message}`
      );
      fd.append("sol", solution);

      const res = await fetch("/sgcaptcha/contact", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Failed to send message");

      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error("Contact form error:", err);
      setStatus("error");
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-surface border-b border-border relative overflow-hidden">
        <FloatingShapes variant="hero" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <ScrollReveal>
            <span className="text-secondary text-sm font-semibold tracking-widest uppercase">Contact Us</span>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <h1 className="font-heading font-bold text-4xl lg:text-5xl text-primary mt-3 max-w-2xl">Get in Touch</h1>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="w-20 h-1 bg-accent mt-4 rounded-full" />
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <p className="mt-6 text-text-muted text-lg leading-relaxed max-w-2xl">
              Have a question about our programs or admissions? We'd love to hear from you.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-20 lg:py-28 relative">
        <FloatingShapes />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Info */}
            <ScrollReveal direction="left">
              <div className="space-y-6">
                {[
                  { icon: <Globe size={20} />, label: "Online Institute", lines: ["BEI operates fully online", "Accessible from anywhere"] },
                  { icon: <Mail size={20} />, label: "General Inquiries", lines: ["info@brilliant-edu.org"] },
                  { icon: <Phone size={20} />, label: "Reach Out", lines: ["Available via email & social media", "Response within 24–48 hours"] },
                ].map((c) => (
                  <div key={c.label} className="flex items-start gap-4 group">
                    <div className="w-10 h-10 rounded-md bg-accent/10 text-accent flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                      {c.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-primary mb-1">{c.label}</h4>
                      {c.lines.map((l) => (
                        <p key={l} className="text-text-muted text-sm">{l}</p>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="border border-border rounded-lg p-6 bg-surface flex items-center justify-center mt-4">
                  <img
                    src="/public_3a72_6b99e0b499cb440bab54307a4a1ab064.jpeg"
                    alt="Brilliant Educational Institute"
                    className="max-h-32 w-auto object-contain"
                    loading="lazy"
                  />
                </div>
              </div>
            </ScrollReveal>

            {/* Form */}
            <ScrollReveal delay={150} direction="right" className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="border border-border rounded-lg p-8 bg-bg hover:border-accent/50 transition-colors duration-300">
                <h3 className="font-heading font-semibold text-xl text-primary mb-6">Send Us a Message</h3>

                {status === "success" && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-md text-sm">
                    Your message has been sent successfully!
                  </div>
                )}
                {status === "error" && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm">
                    Something went wrong. Please try again later.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent transition-colors"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <label className="block text-sm font-medium text-primary mb-1.5">Subject</label>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    required
                    className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent transition-colors"
                  >
                    <option value="">Select a subject</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Admissions">Admissions</option>
                    <option value="Programs">Programs & Departments</option>
                    <option value="Partnerships">Partnerships & Collaboration</option>
                    <option value="Financial Support">Financial Support</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="mt-5">
                  <label className="block text-sm font-medium text-primary mb-1.5">Message</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent transition-colors resize-none"
                    placeholder="How can we help you?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="mt-6 bg-primary hover:bg-primary-light disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-md transition-all duration-300 inline-flex items-center gap-2 hover:scale-105"
                >
                  {status === "sending" ? "Sending..." : (
                    <>Send Message <Send size={16} /></>
                  )}
                </button>
              </form>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;