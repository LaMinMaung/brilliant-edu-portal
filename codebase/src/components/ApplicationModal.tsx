import React, { useState, useEffect } from "react";
import { X, Send, CheckCircle, AlertCircle } from "lucide-react";
import pb from "../lib/pocketbase";
import type { Program } from "./ProgramCard";

declare global {
  interface Window {
    sgpowcaptcha: {
      PoWSolver: new () => { start: (challenge: string) => Promise<string> };
    };
  }
}

interface Props {
  program: Program | null;
  onClose: () => void;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  previousEducation: string;
  gpa: string;
  bachelorDegree: string;
  researchInterests: string;
  currentLevel: string;
  preferredStart: string;
  motivation: string;
}

const initialForm: FormData = {
  fullName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  address: "",
  previousEducation: "",
  gpa: "",
  bachelorDegree: "",
  researchInterests: "",
  currentLevel: "",
  preferredStart: "",
  motivation: "",
};

const ApplicationModal: React.FC<Props> = ({ program, onClose }) => {
  const [form, setForm] = useState<FormData>(initialForm);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  useEffect(() => {
    if (program) {
      document.body.style.overflow = "hidden";
      setForm(initialForm);
      setStatus("idle");
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [program]);

  if (!program) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    try {
      // Prepare application data object
      const applicationData: any = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        dateOfBirth: form.dateOfBirth,
        address: form.address,
        motivation: form.motivation,
      };

      if (program.category === "undergraduate") {
        applicationData.previousEducation = form.previousEducation;
        applicationData.gpa = form.gpa;
      }

      if (program.category === "graduate") {
        applicationData.bachelorDegree = form.bachelorDegree;
        applicationData.gpa = form.gpa;
        applicationData.researchInterests = form.researchInterests;
      }

      if (program.category === "diploma" || program.category === "online") {
        applicationData.currentLevel = form.currentLevel;
        applicationData.preferredStart = form.preferredStart;
      }

      // Save to database
      await pb.collection("applications").create({
        program: program.id,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        dateOfBirth: form.dateOfBirth,
        address: form.address,
        applicationData: applicationData,
        status: "pending",
      });

      // Prepare email message
      await new Promise<void>((resolve, reject) => {
        if (window.sgpowcaptcha) return resolve();
        const script = document.createElement("script");
        script.src = "/sgcaptcha/solver.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load captcha"));
        document.head.appendChild(script);
      });

      const res = await fetch("/sgcaptcha/challenge");
      const challenge = await res.text();
      const pow = new window.sgpowcaptcha.PoWSolver();
      const solution = await pow.start(challenge);

      const lines = [
        `=== NEW APPLICATION: ${program.title} ===`,
        `Category: ${program.category}`,
        `Submitted: ${new Date().toLocaleString()}`,
        "",
        "--- Personal Information ---",
        `Full Name: ${form.fullName}`,
        `Email: ${form.email}`,
        `Phone: ${form.phone}`,
        `Date of Birth: ${form.dateOfBirth}`,
        `Address: ${form.address}`,
      ];

      if (program.category === "undergraduate") {
        lines.push("", "--- Academic Background ---");
        lines.push(`Previous Education: ${form.previousEducation}`);
        lines.push(`GPA: ${form.gpa}`);
      }

      if (program.category === "graduate") {
        lines.push("", "--- Graduate Requirements ---");
        lines.push(`Bachelor's Degree: ${form.bachelorDegree}`);
        lines.push(`GPA: ${form.gpa}`);
        lines.push(`Research Interests: ${form.researchInterests}`);
      }

      if (program.category === "diploma" || program.category === "online") {
        lines.push("", "--- Program Details ---");
        lines.push(`Current Education Level: ${form.currentLevel}`);
        lines.push(`Preferred Start: ${form.preferredStart}`);
      }

      lines.push("", "--- Motivation ---");
      lines.push(form.motivation);
      lines.push("", "---");
      lines.push("This application has been saved to the database.");
      lines.push("Please review in Admin Portal → Applications");

      const fd = new FormData();
      fd.append("message", lines.join("\n"));
      fd.append("sol", solution);

      const contactRes = await fetch("/sgcaptcha/contact", { method: "POST", body: fd });
      if (!contactRes.ok) throw new Error("Failed to submit application");

      setStatus("success");
    } catch (err) {
      console.error("Application submission error:", err);
      setStatus("error");
    }
  };

  const inputClass =
    "w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent transition-colors";
  const labelClass = "block text-sm font-medium text-primary mb-1.5";

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-bg rounded-t-2xl sm:rounded-2xl border border-border overflow-hidden flex flex-col animate-[slideUp_0.3s_ease]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-surface shrink-0">
          <div>
            <h2 className="font-heading font-bold text-xl text-primary">Apply Now</h2>
            <p className="text-text-muted text-sm mt-0.5">{program.title}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-md border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-6">
          {status === "success" ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="font-heading font-bold text-xl text-primary mb-2">
                Application Submitted!
              </h3>
              <p className="text-text-muted text-sm max-w-md mx-auto">
                Thank you for applying to <strong>{program.title}</strong>. Your application has been saved and our admissions team (admission@brilliant-edu.org) will review it and respond within 48 hours.
              </p>
              <button
                onClick={onClose}
                className="mt-6 bg-primary hover:bg-primary-light text-white font-semibold px-6 py-2.5 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {status === "error" && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm">
                  <AlertCircle size={18} />
                  Something went wrong. Please try again.
                </div>
              )}

              {/* Personal Info */}
              <div>
                <h4 className="font-heading font-semibold text-sm text-secondary mb-3 uppercase tracking-wider">
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      placeholder="+95 ..."
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Date of Birth *</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={form.dateOfBirth}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className={labelClass}>Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    required
                    className={inputClass}
                    placeholder="City, State/Region, Country"
                  />
                </div>
              </div>

              {/* Undergraduate fields */}
              {program.category === "undergraduate" && (
                <div>
                  <h4 className="font-heading font-semibold text-sm text-secondary mb-3 uppercase tracking-wider">
                    Academic Background
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Previous Education *</label>
                      <select
                        name="previousEducation"
                        value={form.previousEducation}
                        onChange={handleChange}
                        required
                        className={inputClass}
                      >
                        <option value="">Select level</option>
                        <option value="High School">High School</option>
                        <option value="GED">GED</option>
                        <option value="Diploma">Diploma</option>
                        <option value="Associate Degree">Associate Degree</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>GPA (if available)</label>
                      <input
                        type="text"
                        name="gpa"
                        value={form.gpa}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="e.g. 3.5 / 4.0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Graduate fields */}
              {program.category === "graduate" && (
                <div>
                  <h4 className="font-heading font-semibold text-sm text-secondary mb-3 uppercase tracking-wider">
                    Graduate Requirements
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Bachelor's Degree *</label>
                      <input
                        type="text"
                        name="bachelorDegree"
                        value={form.bachelorDegree}
                        onChange={handleChange}
                        required
                        className={inputClass}
                        placeholder="e.g. BA in English, University of..."
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Undergraduate GPA *</label>
                      <input
                        type="text"
                        name="gpa"
                        value={form.gpa}
                        onChange={handleChange}
                        required
                        className={inputClass}
                        placeholder="e.g. 3.2 / 4.0"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className={labelClass}>Research Interests *</label>
                    <textarea
                      name="researchInterests"
                      value={form.researchInterests}
                      onChange={handleChange}
                      required
                      rows={3}
                      className={`${inputClass} resize-none`}
                      placeholder="Describe your research interests and academic goals..."
                    />
                  </div>
                </div>
              )}

              {/* Diploma / Online fields */}
              {(program.category === "diploma" || program.category === "online") && (
                <div>
                  <h4 className="font-heading font-semibold text-sm text-secondary mb-3 uppercase tracking-wider">
                    Program Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Current Education Level *</label>
                      <select
                        name="currentLevel"
                        value={form.currentLevel}
                        onChange={handleChange}
                        required
                        className={inputClass}
                      >
                        <option value="">Select level</option>
                        <option value="High School (Completed)">High School (Completed)</option>
                        <option value="High School (In Progress)">High School (In Progress)</option>
                        <option value="GED">GED</option>
                        <option value="Some College">Some College</option>
                        <option value="Working Professional">Working Professional</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Preferred Start *</label>
                      <select
                        name="preferredStart"
                        value={form.preferredStart}
                        onChange={handleChange}
                        required
                        className={inputClass}
                      >
                        <option value="">Select term</option>
                        <option value="Immediately">Immediately</option>
                        <option value="Next Month">Next Month</option>
                        <option value="Next Semester">Next Semester</option>
                        <option value="Next Year">Next Year</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Motivation */}
              <div>
                <h4 className="font-heading font-semibold text-sm text-secondary mb-3 uppercase tracking-wider">
                  Motivation
                </h4>
                <label className={labelClass}>
                  Why do you want to join this program? *
                </label>
                <textarea
                  name="motivation"
                  value={form.motivation}
                  onChange={handleChange}
                  required
                  rows={4}
                  className={`${inputClass} resize-none`}
                  placeholder="Tell us about your goals and why this program is right for you..."
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-60 text-primary font-bold py-3 rounded-md transition-all duration-300 inline-flex items-center justify-center gap-2 hover:scale-[1.01]"
                >
                  {status === "sending" ? (
                    "Submitting..."
                  ) : (
                    <>
                      Submit Application <Send size={16} />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 rounded-md border border-border text-text-muted hover:text-primary hover:border-primary font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationModal;