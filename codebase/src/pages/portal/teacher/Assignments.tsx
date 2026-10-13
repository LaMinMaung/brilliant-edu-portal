import React, { useEffect, useState } from "react";
import { Plus, FileText, Calendar, Filter, Edit2, Trash2 } from "lucide-react";
import pb from "../../../lib/pocketbase";
import PortalLayout from "../../../components/PortalLayout";

const TeacherAssignments: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    maxScore: "100",
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const teacherId = pb.authStore.record?.id;
        const coursesData = await pb.collection("courses").getFullList({
          filter: `teacher = "${teacherId}"`,
          sort: "-created",
          requestKey: null,
        });
        setCourses(coursesData);

        if (coursesData.length > 0) {
          setSelectedCourse(coursesData[0].id);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;

    const fetchAssignments = async () => {
      setLoading(true);
      try {
        const assignmentsData = await pb.collection("assignments").getFullList({
          filter: `course = "${selectedCourse}"`,
          sort: "-dueDate",
          requestKey: null,
        });

        setAssignments(assignmentsData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching assignments:", err);
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [selectedCourse]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const teacherId = pb.authStore.record?.id;

      const newAssignment = await pb.collection("assignments").create({
        course: selectedCourse,
        title: formData.title,
        description: formData.description,
        dueDate: new Date(formData.dueDate).toISOString(),
        maxScore: parseFloat(formData.maxScore),
        status: "active",
        createdBy: teacherId,
      });

      setAssignments([newAssignment, ...assignments]);
      setShowCreateModal(false);
      setFormData({ title: "", description: "", dueDate: "", maxScore: "100" });
    } catch (err) {
      console.error("Error creating assignment:", err);
      alert("Failed to create assignment");
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;

    try {
      await pb.collection("assignments").delete(id);
      setAssignments(assignments.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Error deleting assignment:", err);
      alert("Failed to delete assignment");
    }
  };

  const statusStyles: Record<string, string> = {
    active: "bg-green-100 text-green-800 border-green-300",
    closed: "bg-gray-100 text-gray-800 border-gray-300",
  };

  return (
    <PortalLayout role="teacher">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-2">
              Assignments
            </h2>
            <p className="text-text-muted">Create and manage course assignments</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-accent hover:bg-accent-light text-primary font-semibold px-6 py-2.5 rounded-md transition-colors inline-flex items-center gap-2"
          >
            <Plus size={18} />
            Create Assignment
          </button>
        </div>

        {/* Course Filter */}
        <div className="mb-6 flex items-center gap-3">
          <Filter size={18} className="text-secondary" />
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="border border-border rounded-md px-4 py-2 text-sm text-text bg-surface focus:outline-none focus:border-accent"
          >
            <option value="">Select Course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.title}
              </option>
            ))}
          </select>
        </div>

        {/* Assignments List */}
        {loading ? (
          <p className="text-text-muted text-center py-12">Loading assignments...</p>
        ) : !selectedCourse ? (
          <div className="text-center py-12 border border-border rounded-lg bg-surface">
            <FileText size={48} className="mx-auto text-text-muted/30 mb-4" />
            <p className="text-text-muted">Select a course to view assignments</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg bg-surface">
            <FileText size={48} className="mx-auto text-text-muted/30 mb-4" />
            <p className="text-text-muted mb-4">No assignments created yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary hover:bg-primary-light text-white font-semibold px-6 py-2.5 rounded-md transition-colors"
            >
              Create First Assignment
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="border border-border rounded-lg p-6 bg-surface hover:border-accent transition-colors duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-heading font-semibold text-lg text-primary">
                        {assignment.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          statusStyles[assignment.status]
                        }`}
                      >
                        {assignment.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-text-muted mb-4">
                      {assignment.description}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-text-muted">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-secondary" />
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </div>
                      <div>Max Score: {assignment.maxScore}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-secondary hover:text-primary transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteAssignment(assignment.id)}
                      className="p-2 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Assignment Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-primary/50 backdrop-blur-sm"
              onClick={() => setShowCreateModal(false)}
            />
            <div className="relative w-full max-w-2xl max-h-[90vh] bg-bg rounded-lg border border-border overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-border bg-surface">
                <h3 className="font-heading font-bold text-xl text-primary">
                  Create Assignment
                </h3>
              </div>
              <form onSubmit={handleCreateAssignment} className="p-6 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                      className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent"
                      placeholder="e.g., Essay on Romeo and Juliet"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={4}
                      className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent resize-none"
                      placeholder="Describe the assignment requirements..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">
                        Due Date *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.dueDate}
                        onChange={(e) =>
                          setFormData({ ...formData, dueDate: e.target.value })
                        }
                        required
                        className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">
                        Max Score
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.maxScore}
                        onChange={(e) =>
                          setFormData({ ...formData, maxScore: e.target.value })
                        }
                        className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t border-border">
                  <button
                    type="submit"
                    className="flex-1 bg-accent hover:bg-accent-light text-primary font-bold py-3 rounded-md transition-colors"
                  >
                    Create Assignment
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-3 rounded-md border border-border text-text-muted hover:text-primary hover:border-primary font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default TeacherAssignments;