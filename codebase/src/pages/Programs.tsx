import React, { useState, useEffect } from "react";
import { Clock, Users, CheckCircle, Edit2, Plus, X, Upload, Trash2, EyeOff } from "lucide-react";
import ScrollReveal from "../components/ScrollReveal";
import SectionHeading from "../components/SectionHeading";
import TiltCard from "../components/TiltCard";
import FloatingShapes from "../components/FloatingShapes";
import ProgramCard from "../components/ProgramCard";
import type { Program } from "../components/ProgramCard";
import { Link } from "react-router-dom";
import pb from "../lib/pocketbase";

// Extended type to carry the published state alongside the Program fields
type InfoProgram = Program & { published: boolean };

type FilterKey = "all" | "diploma" | "undergraduate" | "graduate" | "online";

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All Programs" },
  { key: "diploma", label: "Diploma" },
  { key: "undergraduate", label: "Undergraduate" },
  { key: "graduate", label: "Graduate" },
  { key: "online", label: "Online" },
];

const departments = [
  {
    img: "/public_528f_82206f61baf24677ab5d722505732a5c.jpeg",
    title: "Department of Liberal Arts",
    subtitle: "Languages & Humanities",
    duration: "Flexible schedules",
    classSize: "Online classes",
    description:
      "The Liberal Arts department offers language programs in English, Burmese, and Japanese, along with humanities courses that develop communication, critical thinking, and cultural understanding.",
    highlights: [
      "English, Burmese & Japanese language courses",
      "Academic writing & communication skills",
      "Cultural studies & critical thinking",
      "Foundation for university-level studies",
    ],
  },
  {
    img: "/public_b494_3ad68564ef764a7b813b3054c00393fc.jpeg",
    title: "ICT Department",
    subtitle: "Technology & Programming",
    duration: "16–24 weeks per course",
    classSize: "Project-based learning",
    description:
      "Industry-aligned courses covering web development, programming, and data science. Students learn HTML, CSS, JavaScript, Python, React, and Java — gaining practical, real-world skills.",
    highlights: [
      "HTML, CSS, JavaScript & React",
      "Python & Java programming",
      "Hands-on projects & portfolio building",
      "Career guidance & freelance readiness",
    ],
  },
  {
    img: "/public_9226_5b3b4db22ccc4f25af88fe7e791ae45e.jpeg",
    title: "Department of Social Science",
    subtitle: "Society & Global Studies",
    duration: "Semester-based",
    classSize: "Discussion-focused",
    description:
      "Explore the foundations of social science through courses in sociology, political science, economics, and global studies. Prepares students for careers in public service and academic research.",
    highlights: [
      "Sociology & political science",
      "Economics & global studies",
      "Research methodology training",
      "Preparation for social science degrees",
    ],
  },
  {
    img: "/public_09bd_77c24b70663b45b493dbab555747d39b.jpeg",
    title: "Research & Development",
    subtitle: "Innovation & Academic Research",
    duration: "Ongoing programs",
    classSize: "Mentored research",
    description:
      "The R&D department drives innovation at BEI, conducting educational research, developing curriculum, and exploring new teaching methodologies.",
    highlights: [
      "Educational research projects",
      "Curriculum development initiatives",
      "Innovation in teaching methods",
      "Faculty & student collaboration",
    ],
  },
];

const examPrep = [
  {
    title: "GED Preparation",
    subtitle: "High School Equivalency",
    duration: "12–16 weeks",
    description:
      "Comprehensive preparation for all four GED subject tests — Mathematical Reasoning, Reasoning Through Language Arts, Science, and Social Studies.",
    highlights: [
      "All 4 subject areas covered",
      "Weekly mock exams",
      "One-on-one tutoring available",
      "Flexible schedules",
    ],
  },
  {
    title: "IELTS & TOEFL Training",
    subtitle: "English Proficiency Certification",
    duration: "8–12 weeks",
    description:
      "Structured training covering all modules — Listening, Reading, Writing, and Speaking. Includes British Council EnglishScore certification partnership.",
    highlights: [
      "All 4 modules covered",
      "British Council EnglishScore",
      "Simulated tests weekly",
      "Average 1.5 band improvement",
    ],
  },
];

const Programs: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [allPrograms, setAllPrograms] = useState<InfoProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    category: "diploma",
    description: "",
    duration: "",
    credits: "",
    tags: [] as string[],
    comingSoon: false,
    fullContent: "",
    applyFormLink: "",
    published: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Both 'admin' and 'information_admin' can manage Information Programs
  const userRole = pb.authStore.record?.role;
  const canManageInfo = pb.authStore.isValid && (userRole === "admin" || userRole === "information_admin");

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      // PocketBase listRule enforces: public sees published=true only;
      // admin / information_admin see all records server-side.
      const programsData = await pb.collection("information_programs").getFullList({
        sort: "created",
        requestKey: null,
      });

      const mappedPrograms: InfoProgram[] = programsData.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category as Program["category"],
        description: p.description,
        duration: p.duration,
        credits: p.credits,
        tags: p.tags || [],
        image: p.image ? pb.files.getURL(p, p.image) : undefined,
        comingSoon: p.comingSoon,
        applyFormLink: p.applyFormLink || "",
        published: p.published ?? true,
      }));

      setAllPrograms(mappedPrograms);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching information programs:", err);
      setLoading(false);
    }
  };

  const handleEdit = (program: InfoProgram) => {
    setEditingId(program.id);
    setEditForm({
      title: program.title,
      category: program.category,
      description: program.description,
      duration: program.duration,
      credits: program.credits,
      tags: program.tags,
      comingSoon: program.comingSoon || false,
      fullContent: "",
      applyFormLink: program.applyFormLink || "",
      published: program.published,
    });
    setImageFile(null);
    setShowCreateModal(false);

    // Load fullContent, applyFormLink, and published status from the database
    pb.collection("information_programs")
      .getOne(program.id, { requestKey: null })
      .then((data) => {
        setEditForm((prev) => ({
          ...prev,
          fullContent: data.fullContent || "",
          applyFormLink: data.applyFormLink || "",
          published: data.published ?? true,
        }));
      });
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setEditForm({
      title: "",
      category: "diploma",
      description: "",
      duration: "",
      credits: "",
      tags: [],
      comingSoon: false,
      fullContent: "",
      applyFormLink: "",
      published: true,
    });
    setImageFile(null);
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append("title", editForm.title);
      formData.append("category", editForm.category);
      formData.append("description", editForm.description);
      formData.append("duration", editForm.duration);
      formData.append("credits", editForm.credits);
      editForm.tags.forEach(t => formData.append("tags", t));
      formData.append("comingSoon", editForm.comingSoon.toString());
      formData.append("fullContent", editForm.fullContent);
      formData.append("applyFormLink", editForm.applyFormLink || "");
      formData.append("published", editForm.published.toString());

      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (editingId) {
        await pb.collection("information_programs").update(editingId, formData);
      } else {
        await pb.collection("information_programs").create(formData);
      }

      await fetchPrograms();
      setEditingId(null);
      setShowCreateModal(false);
      setImageFile(null);
    } catch (err) {
      console.error("Error saving information program:", err);
      alert("Failed to save. Please try again.");
    }
  };

  // information_programs has NO relation to applications, students, or any other collection.
  // Deletion is safe and only affects the information record itself.
  const handleDelete = async (id: string, programTitle?: string) => {
    if (!confirm("Are you sure you want to delete this program? This action cannot be undone.")) return;

    try {
      await pb.collection("information_programs").delete(id);
      await fetchPrograms();
      setEditingId(null);
      setShowCreateModal(false);
    } catch (err: any) {
      console.error("Error deleting information program:", err);
      const detail: string = err?.response?.message || err?.data?.message || err?.message || "";
      alert(
        `Unable to delete "${programTitle || "this program"}".\n\n` +
        `Technical detail: ${detail || "Unknown error — see browser console for details."}`
      );
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

  const filtered = React.useMemo(() => {
    if (activeFilter === "all") return allPrograms;
    if (activeFilter === "online") {
      return allPrograms.filter((p) =>
        p.tags.some((t) => t.toLowerCase() === "flexible" || t.toLowerCase() === "part-time")
      );
    }
    return allPrograms.filter((p) => p.category === activeFilter);
  }, [activeFilter, allPrograms]);

  // Filter count for tabs: public only sees published, admin sees all
  const countFor = (key: FilterKey) => {
    const source = canManageInfo ? allPrograms : allPrograms.filter(p => p.published);
    if (key === "all") return source.length;
    if (key === "online") return source.filter(p => p.tags.some(t => t.toLowerCase() === "flexible" || t.toLowerCase() === "part-time")).length;
    return source.filter(p => p.category === key).length;
  };

  const availableTags = [
    "Full-Time", "Part-Time", "Flexible", "English", "Literature", "Research",
    "Programming", "Web Dev", "ICT", "TESOL", "Pedagogy", "Teaching",
    "Communication", "Linguistics", "Social Impact", "Development",
    "Leadership", "Management", "Foundation", "Advanced", "Coming Soon",
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-surface border-b border-border relative overflow-hidden">
        <FloatingShapes variant="hero" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <ScrollReveal>
            <span className="text-secondary text-sm font-semibold tracking-widest uppercase">
              Programs & Departments
            </span>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <h1 className="font-heading font-bold text-4xl lg:text-5xl text-primary mt-3 max-w-2xl">
              Learn, Grow, Succeed
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="w-20 h-1 bg-accent mt-4 rounded-full" />
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <p className="mt-6 text-text-muted text-lg leading-relaxed max-w-2xl">
              BEI offers diploma, undergraduate, and graduate programs plus
              international exam preparation — all designed to open doors for
              Myanmar students.
            </p>
          </ScrollReveal>
          {canManageInfo && (
            <ScrollReveal delay={400}>
              <button
                onClick={handleCreateNew}
                className="mt-6 bg-primary hover:bg-primary-light text-white font-semibold px-6 py-2.5 rounded-md transition-colors inline-flex items-center gap-2"
              >
                <Plus size={18} />
                Create Program
              </button>
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* Filterable Program Listing */}
      <section className="py-20 lg:py-28 relative">
        <FloatingShapes />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="Our Programs"
            title="Explore Degree & Diploma Programs"
            subtitle="Filter by category to find the right program for your academic journey."
          />

          {/* Filter Tabs */}
          <ScrollReveal>
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {filters.map((f) => {
                const isActive = activeFilter === f.key;
                const count = countFor(f.key);

                return (
                  <button
                    key={f.key}
                    onClick={() => setActiveFilter(f.key)}
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 border ${
                      isActive
                        ? "bg-primary text-white border-primary scale-105"
                        : "bg-bg text-text-muted border-border hover:border-primary hover:text-primary"
                    }`}
                  >
                    {f.label}
                    <span
                      className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                        isActive ? "bg-white/20 text-white" : "bg-surface text-text-muted"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </ScrollReveal>

          {/* Program Grid */}
          {loading ? (
            <p className="text-text-muted text-center py-12">Loading programs...</p>
          ) : (
            <div
              key={activeFilter}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filtered.map((program, i) => (
                <div key={program.id} className="relative">
                  {/* Unpublished badge — only visible to admin / information_admin */}
                  {canManageInfo && !program.published && (
                    <div className="absolute top-0 left-0 right-0 z-20 flex justify-center pt-2 pointer-events-none">
                      <span className="inline-flex items-center gap-1 bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
                        <EyeOff size={10} />Unpublished
                      </span>
                    </div>
                  )}
                  <ProgramCard program={program} index={i} />
                  {canManageInfo && (
                    <div className="absolute top-3 right-3 flex gap-1.5 z-10">
                      <button
                        onClick={() => handleEdit(program)}
                        className="p-2 bg-white/90 hover:bg-white border border-border rounded-md text-secondary hover:text-primary transition-colors"
                        title="Edit program"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(program.id, program.title)}
                        className="p-2 bg-white/90 hover:bg-red-50 border border-border hover:border-red-300 rounded-md text-text-muted hover:text-red-600 transition-colors"
                        title="Delete program"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {filtered.length === 0 && !loading && (
            <div className="text-center py-16 text-text-muted">
              <p className="text-lg">No programs found in this category.</p>
              <button
                onClick={() => setActiveFilter("all")}
                className="mt-4 text-primary font-semibold hover:underline"
              >
                View all programs
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Departments */}
      <section className="bg-surface border-y border-border py-20 lg:py-28 relative">
        <FloatingShapes />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="Departments"
            title="Our Four Pillars"
            subtitle="Each department is dedicated to a core area of knowledge and skill development."
          />
          <div className="space-y-8">
            {departments.map((d, i) => (
              <ScrollReveal key={d.title} delay={i * 80}>
                <div className="border border-border rounded-lg p-8 lg:p-10 bg-bg hover:border-accent transition-colors duration-300 group">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-16 h-16 rounded-md bg-surface flex items-center justify-center shrink-0 p-2 group-hover:bg-accent/5 transition-colors duration-300">
                          <img
                            src={d.img}
                            alt={d.title}
                            className="max-h-12 w-auto object-contain"
                            loading="lazy"
                          />
                        </div>
                        <div>
                          <h3 className="font-heading font-bold text-xl text-primary">
                            {d.title}
                          </h3>
                          <span className="text-text-muted text-sm">{d.subtitle}</span>
                        </div>
                      </div>
                      <p className="text-text-muted text-sm leading-relaxed mb-5">
                        {d.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-text-muted">
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} className="text-secondary" /> {d.duration}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users size={14} className="text-secondary" /> {d.classSize}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-primary mb-3">Key Focus Areas</h4>
                      <ul className="space-y-2.5">
                        {d.highlights.map((h) => (
                          <li key={h} className="flex items-start gap-2 text-sm text-text-muted">
                            <CheckCircle size={16} className="text-accent mt-0.5 shrink-0" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Exam Preparation */}
      <section className="py-20 lg:py-28 relative">
        <FloatingShapes />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="Exam Preparation"
            title="International Certifications"
            subtitle="Prepare for globally recognized exams that open doors to universities, scholarships, and careers."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {examPrep.map((ep, i) => (
              <ScrollReveal key={ep.title} delay={i * 120}>
                <TiltCard
                  className="bg-bg border border-border rounded-lg p-8 h-full hover:border-accent transition-colors duration-300"
                  intensity={5}
                >
                  <h3 className="font-heading font-bold text-xl text-primary mb-1">
                    {ep.title}
                  </h3>
                  <span className="text-text-muted text-sm">{ep.subtitle}</span>
                  <div className="flex items-center gap-1.5 text-sm text-secondary mt-2 mb-4">
                    <Clock size={14} /> {ep.duration}
                  </div>
                  <p className="text-text-muted text-sm leading-relaxed mb-5">{ep.description}</p>
                  <ul className="space-y-2">
                    {ep.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2 text-sm text-text-muted">
                        <CheckCircle size={16} className="text-accent mt-0.5 shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </TiltCard>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal className="mt-12 text-center">
            <p className="text-text-muted mb-4">
              Ready to begin your journey? Apply now to join BEI.
            </p>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLScMTEA_EdoK7MokxUTZaaK27gGzoux82r0u9flZwxPePZPYiA/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-primary hover:bg-primary-light text-white font-bold px-7 py-3 rounded-md transition-all duration-300 hover:scale-105"
            >
              Apply Now
            </a>
          </ScrollReveal>
        </div>
      </section>

      {/* Edit/Create Program Modal */}
      {(editingId || showCreateModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-primary/50 backdrop-blur-sm"
            onClick={() => {
              setEditingId(null);
              setShowCreateModal(false);
            }}
          />
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-bg rounded-lg border border-border overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
              <h3 className="font-heading font-bold text-xl text-primary">
                {editingId ? "Edit Program" : "Create Program"}
              </h3>
              <button
                onClick={() => {
                  setEditingId(null);
                  setShowCreateModal(false);
                }}
                className="text-text-muted hover:text-primary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Title *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent"
                  placeholder="Program title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Category *</label>
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
                <div className="flex flex-col gap-3 justify-center pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.published}
                      onChange={(e) => setEditForm({ ...editForm, published: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-text">Published (visible to public)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.comingSoon}
                      onChange={(e) => setEditForm({ ...editForm, comingSoon: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-text">Mark as coming soon</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Duration *</label>
                  <input
                    type="text"
                    value={editForm.duration}
                    onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                    className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent"
                    placeholder="e.g., 4 Years"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Credits *</label>
                  <input
                    type="text"
                    value={editForm.credits}
                    onChange={(e) => setEditForm({ ...editForm, credits: e.target.value })}
                    className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent"
                    placeholder="e.g., 120 Credits"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Short Description *</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent resize-none"
                  placeholder="Brief description for program card (max 1000 characters)"
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
                <label className="block text-sm font-medium text-primary mb-1.5">Image Upload</label>
                <div className="border-2 border-dashed border-border rounded-md p-6 text-center hover:border-accent transition-colors">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="program-image-upload"
                  />
                  <label htmlFor="program-image-upload" className="cursor-pointer">
                    <Upload size={32} className="mx-auto text-text-muted mb-2" />
                    <p className="text-sm font-medium text-primary">
                      {imageFile ? imageFile.name : "Click to upload image"}
                    </p>
                    <p className="text-xs text-text-muted mt-1">JPG, PNG, WEBP (max 5MB)</p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Apply Form Link</label>
                <input
                  type="url"
                  value={editForm.applyFormLink}
                  onChange={(e) => setEditForm({ ...editForm, applyFormLink: e.target.value })}
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent"
                  placeholder="https://example.com/apply-form"
                />
                <p className="text-xs text-text-muted mt-1">
                  External URL for the program application form (opens in new tab)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Full Program Content</label>
                <textarea
                  value={editForm.fullContent}
                  onChange={(e) => setEditForm({ ...editForm, fullContent: e.target.value })}
                  rows={8}
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent resize-none font-mono"
                  placeholder="Full program details (supports HTML: <h2>, <p>, <ul>, <li>, <strong>, etc.)"
                />
                <p className="text-xs text-text-muted mt-1">
                  You can use HTML tags: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-border bg-surface">
              <button
                onClick={handleSave}
                className="flex-1 bg-primary hover:bg-primary-light text-white font-bold py-3 rounded-md transition-colors"
              >
                {editingId ? "Save Changes" : "Create Program"}
              </button>
              {editingId && (
                <button
                  onClick={() => handleDelete(editingId, editForm.title)}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-md transition-colors"
                >
                  Delete
                </button>
              )}
              <button
                onClick={() => {
                  setEditingId(null);
                  setShowCreateModal(false);
                }}
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

export default Programs;
