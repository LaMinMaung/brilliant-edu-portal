import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, BookOpen, Award, FileText, Edit2, X, Upload } from "lucide-react";
import ScrollReveal from "../components/ScrollReveal";
import FloatingShapes from "../components/FloatingShapes";
import TiltCard from "../components/TiltCard";
import pb from "../lib/pocketbase";

const ProgramDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    category: "",
    description: "",
    duration: "",
    credits: "",
    tags: [] as string[],
    comingSoon: false,
    fullContent: "",
    applyFormLink: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const userRole = pb.authStore.record?.role;
  const canManageInfo = pb.authStore.isValid && (userRole === "admin" || userRole === "information_admin");

  useEffect(() => {
    fetchProgram();
  }, [id]);

  const fetchProgram = async () => {
    try {
      const data = await pb.collection("information_programs").getOne(id!, {
        requestKey: null,
      });
      setProgram(data);
      setEditForm({
        title: data.title,
        category: data.category,
        description: data.description,
        duration: data.duration,
        credits: data.credits,
        tags: data.tags || [],
        comingSoon: data.comingSoon,
        fullContent: data.fullContent || "",
        applyFormLink: data.applyFormLink || "",
      });
      setLoading(false);
    } catch (err) {
      console.error("Error fetching program:", err);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append("title", editForm.title);
      formData.append("category", editForm.category);
      formData.append("description", editForm.description);
      formData.append("duration", editForm.duration);
      formData.append("credits", editForm.credits);
      formData.append("tags", JSON.stringify(editForm.tags));
      formData.append("comingSoon", editForm.comingSoon.toString());
      formData.append("fullContent", editForm.fullContent);
      formData.append("applyFormLink", editForm.applyFormLink || "");

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const updated = await pb.collection("information_programs").update(id!, formData);
      setProgram(updated);
      setEditing(false);
      setImageFile(null);
    } catch (err) {
      console.error("Error updating program:", err);
      alert("Failed to save changes. Please try again.");
    }
  };

  const handleTagToggle = (tag: string) => {
    setEditForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const availableTags = [
    "Full-Time",
    "Part-Time",
    "Flexible",
    "English",
    "Literature",
    "Research",
    "Programming",
    "Web Dev",
    "ICT",
    "TESOL",
    "Pedagogy",
    "Teaching",
    "Communication",
    "Linguistics",
    "Social Impact",
    "Development",
    "Leadership",
    "Management",
    "Foundation",
    "Advanced",
    "Coming Soon",
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <p className="text-text-muted">Loading program...</p>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-4">
        <div className="text-center">
          <h1 className="font-heading font-bold text-3xl text-primary mb-4">
            Program Not Found
          </h1>
          <p className="text-text-muted mb-8">
            The program you're looking for doesn't exist.
          </p>
          <Link
            to="/programs"
            className="inline-block bg-primary hover:bg-primary-light text-white font-semibold px-6 py-3 rounded-md transition-colors"
          >
            View All Programs
          </Link>
        </div>
      </div>
    );
  }

  const categoryLabels: Record<string, string> = {
    diploma: "Diploma",
    undergraduate: "Undergraduate",
    graduate: "Graduate",
    online: "Online",
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-surface border-b border-border relative overflow-hidden">
        <FloatingShapes variant="hero" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <ScrollReveal>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors mb-6"
            >
              <ArrowLeft size={16} />
              Back to Programs
            </button>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <span className="text-secondary text-sm font-semibold tracking-widest uppercase">
              {categoryLabels[program.category]}
            </span>
          </ScrollReveal>
          <ScrollReveal delay={150}>
            <h1 className="font-heading font-bold text-4xl lg:text-5xl text-primary mt-3">
              {program.title}
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="w-20 h-1 bg-accent mt-4 rounded-full" />
          </ScrollReveal>
          <ScrollReveal delay={250}>
            <div className="flex items-center gap-6 mt-6">
              <div className="flex items-center gap-6 text-sm text-text-muted">
                <span className="flex items-center gap-2">
                  <Clock size={16} className="text-secondary" />
                  {program.duration}
                </span>
                <span className="flex items-center gap-2">
                  <BookOpen size={16} className="text-secondary" />
                  {program.credits}
                </span>
                <span className="flex items-center gap-2">
                  <Award size={16} className="text-secondary" />
                  Accredited Program
                </span>
              </div>
              {canManageInfo && (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors font-semibold"
                >
                  <Edit2 size={16} />
                  Edit Program
                </button>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>
      {/* Program Content */}
      <section className="py-20 lg:py-28 relative">
        <FloatingShapes />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Featured Image */}
              {program.image && (
                <ScrollReveal>
                  <div className="rounded-lg overflow-hidden border border-border">
                    <img
                      src={pb.files.getURL(program, program.image)}
                      alt={program.title}
                      className="w-full h-auto"
                      loading="lazy"
                    />
                  </div>
                </ScrollReveal>
              )}

              {/* Program Details */}
              <ScrollReveal delay={100}>
                <div>
                  <h2 className="font-heading font-bold text-2xl text-primary mb-4">
                    Program Overview
                  </h2>
                  <p className="text-text-muted leading-relaxed mb-6">{program.description}</p>
                  
                  {program.fullContent && (
                    <div
                      className="prose prose-lg max-w-none text-text"
                      dangerouslySetInnerHTML={{ __html: program.fullContent }}
                      style={{ lineHeight: "1.8" }}
                    />
                  )}
                </div>
              </ScrollReveal>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <ScrollReveal delay={100}>
                <TiltCard className="border border-border rounded-lg p-6 bg-bg sticky top-24">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-md bg-accent/10 text-accent flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <h3 className="font-heading font-semibold text-lg text-primary">
                      Program Details
                    </h3>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Duration:</span>
                      <span className="font-semibold text-primary">{program.duration}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Credits:</span>
                      <span className="font-semibold text-primary">{program.credits}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Category:</span>
                      <span className="font-semibold text-primary capitalize">
                        {categoryLabels[program.category]}
                      </span>
                    </div>
                  </div>

                  {program.tags && program.tags.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm font-medium text-primary mb-2">Tags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {program.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="text-[11px] px-2.5 py-0.5 rounded-full bg-surface border border-border text-text-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {program.applyFormLink ? (
                    <a
                      href={program.applyFormLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center bg-primary hover:bg-primary-light text-white font-bold px-6 py-3 rounded-md transition-all duration-300 hover:scale-105 text-sm"
                    >
                      Apply Now
                    </a>
                  ) : (
                    <Link
                      to="/admissions"
                      className="block text-center bg-primary hover:bg-primary-light text-white font-bold px-6 py-3 rounded-md transition-all duration-300 hover:scale-105 text-sm"
                    >
                      Apply Now
                    </Link>
                  )}
                  <Link
                    to="/contact"
                    className="block text-center mt-3 border-2 border-border text-text hover:border-primary hover:text-primary font-semibold px-6 py-3 rounded-md transition-all duration-300 text-sm"
                  >
                    Contact Admissions
                  </Link>
                </TiltCard>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>
      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-primary/50 backdrop-blur-sm"
            onClick={() => setEditing(false)}
          />
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-bg rounded-lg border border-border overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
              <h3 className="font-heading font-bold text-xl text-primary">Edit Program</h3>
              <button
                onClick={() => setEditing(false)}
                className="text-text-muted hover:text-primary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">
                    Category *
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent"
                  >
                    <option value="diploma">Diploma</option>
                    <option value="undergraduate">Undergraduate</option>
                    <option value="graduate">Graduate</option>
                    <option value="online">Online</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">
                    Coming Soon?
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={editForm.comingSoon}
                      onChange={(e) =>
                        setEditForm({ ...editForm, comingSoon: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-text">Mark as coming soon</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">
                    Duration *
                  </label>
                  <input
                    type="text"
                    value={editForm.duration}
                    onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                    className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">
                    Credits *
                  </label>
                  <input
                    type="text"
                    value={editForm.credits}
                    onChange={(e) => setEditForm({ ...editForm, credits: e.target.value })}
                    className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">
                  Short Description *
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Tags</label>
                <div className="flex flex-wrap gap-2 p-3 border border-border rounded-md bg-bg">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        editForm.tags.includes(tag)
                          ? "bg-accent text-primary border border-accent"
                          : "bg-surface text-text-muted border border-border hover:border-primary"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">
                  Image Upload
                </label>
                <div className="border-2 border-dashed border-border rounded-md p-6 text-center hover:border-accent transition-colors">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="program-image-edit"
                  />
                  <label htmlFor="program-image-edit" className="cursor-pointer">
                    <Upload size={32} className="mx-auto text-text-muted mb-2" />
                    <p className="text-sm font-medium text-primary">
                      {imageFile ? imageFile.name : "Click to upload new image"}
                    </p>
                    <p className="text-xs text-text-muted mt-1">JPG, PNG, WEBP (max 5MB)</p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">
                  Apply Form Link
                </label>
                <input
                  type="url"
                  value={editForm.applyFormLink}
                  onChange={(e) => setEditForm({ ...editForm, applyFormLink: e.target.value })}
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent"
                  placeholder="https://example.com/apply-form"
                />
                <p className="text-xs text-text-muted mt-1">
                  External URL — opens in new tab when visitors click Apply Now
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">
                  Full Program Content
                </label>
                <textarea
                  value={editForm.fullContent}
                  onChange={(e) => setEditForm({ ...editForm, fullContent: e.target.value })}
                  rows={10}
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent resize-none font-mono"
                  placeholder="Full program details (supports HTML)"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-border bg-surface">
              <button
                onClick={handleSave}
                className="flex-1 bg-primary hover:bg-primary-light text-white font-bold py-3 rounded-md transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-6 py-3 rounded-md border border-border text-text-muted hover:text-primary hover:border-primary font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramDetail;