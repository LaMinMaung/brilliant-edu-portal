import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Search, BookOpen } from "lucide-react";
import pb from "../../../lib/pocketbase";
import PortalLayout from "../../../components/PortalLayout";

const AdminCourses: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    credits: "3",
    teacher: "",
    semester: "",
    maxStudents: "",
    status: "active",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coursesData, teachersData] = await Promise.all([
        pb.collection("courses").getFullList({
          expand: "teacher",
          sort: "-created",
          requestKey: null,
        }),
        pb.collection("users").getFullList({
          filter: 'role = "teacher"',
          requestKey: null,
        }),
      ]);

      setCourses(coursesData);
      setTeachers(teachersData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await pb.collection("courses").create({
        code: formData.code,
        title: formData.title,
        description: formData.description,
        credits: parseInt(formData.credits),
        teacher: formData.teacher,
        semester: formData.semester,
        maxStudents: formData.maxStudents ? parseInt(formData.maxStudents) : undefined,
        status: formData.status,
      });

      await fetchData();
      setShowCreateModal(false);
      setFormData({
        code: "",
        title: "",
        description: "",
        credits: "3",
        teacher: "",
        semester: "",
        maxStudents: "",
        status: "active",
      });
    } catch (err: any) {
      console.error("Error creating course:", err);
      alert(err.message || "Failed to create course");
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      await pb.collection("courses").delete(id);
      setCourses(courses.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Error deleting course:", err);
      alert("Failed to delete course");
    }
  };

  const statusStyles: Record<string, string> = {
    active: "bg-green-100 text-green-800 border-green-300",
    completed: "bg-gray-100 text-gray-800 border-gray-300",
    upcoming: "bg-blue-100 text-blue-800 border-blue-300",
  };

  return (
    <PortalLayout role="admin">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-2">
              Course Management
            </h2>
            <p className="text-text-muted">Manage all courses across the institution</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-accent hover:bg-accent-light text-primary font-semibold px-6 py-2.5 rounded-md transition-colors inline-flex items-center gap-2"
          >
            <Plus size={18} />
            Create Course
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Courses", value: courses.length, color: "text-primary" },
            {
              label: "Active",
              value: courses.filter((c) => c.status === "active").length,
              color: "text-green-600",
            },
            {
              label: "Upcoming",
              value: courses.filter((c) => c.status === "upcoming").length,
              color: "text-blue-600",
            },
            {
              label: "Completed",
              value: courses.filter((c) => c.status === "completed").length,
              color: "text-gray-600",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="border border-border rounded-lg p-4 bg-surface"
            >
              <p className="text-sm text-text-muted mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Courses Table */}
        {loading ? (
          <p className="text-text-muted text-center py-12">Loading courses...</p>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg bg-surface">
            <BookOpen size={48} className="mx-auto text-text-muted/30 mb-4" />
            <p className="text-text-muted mb-4">No courses created yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary hover:bg-primary-light text-white font-semibold px-6 py-2.5 rounded-md transition-colors"
            >
              Create First Course
            </button>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-primary text-white">
                    <th className="text-left px-6 py-3 font-semibold text-sm">Code</th>
                    <th className="text-left px-6 py-3 font-semibold text-sm">Title</th>
                    <th className="text-left px-6 py-3 font-semibold text-sm">Teacher</th>
                    <th className="text-left px-6 py-3 font-semibold text-sm">Semester</th>
                    <th className="text-center px-6 py-3 font-semibold text-sm">
                      Credits
                    </th>
                    <th className="text-center px-6 py-3 font-semibold text-sm">Status</th>
                    <th className="text-center px-6 py-3 font-semibold text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr
                      key={course.id}
                      className="border-b border-border last:border-0 hover:bg-bg transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-primary">
                        {course.code}
                      </td>
                      <td className="px-6 py-4 text-sm">{course.title}</td>
                      <td className="px-6 py-4 text-sm text-text-muted">
                        {course.expand?.teacher?.name || "Unassigned"}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-muted">
                        {course.semester}
                      </td>
                      <td className="px-6 py-4 text-center text-sm">{course.credits}</td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize ${
                            statusStyles[course.status]
                          }`}
                        >
                          {course.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-2 text-secondary hover:text-primary transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(course.id)}
                            className="p-2 text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Course Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-primary/50 backdrop-blur-sm"
              onClick={() => setShowCreateModal(false)}
            />
            <div className="relative w-full max-w-2xl max-h-[90vh] bg-bg rounded-lg border border-border overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-border bg-surface">
                <h3 className="font-heading font-bold text-xl text-primary">
                  Create New Course
                </h3>
              </div>
              <form onSubmit={handleCreateCourse} className="p-6 overflow-y-auto">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">
                        Course Code *
                      </label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) =>
                          setFormData({ ...formData, code: e.target.value })
                        }
                        required
                        className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent"
                        placeholder="e.g., CS101"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">
                        Credits *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={formData.credits}
                        onChange={(e) =>
                          setFormData({ ...formData, credits: e.target.value })
                        }
                        required
                        className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">
                      Course Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                      className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent"
                      placeholder="e.g., Introduction to Programming"
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
                      rows={3}
                      className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent resize-none"
                      placeholder="Course description..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">
                        Assigned Teacher *
                      </label>
                      <select
                        value={formData.teacher}
                        onChange={(e) =>
                          setFormData({ ...formData, teacher: e.target.value })
                        }
                        required
                        className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent"
                      >
                        <option value="">Select Teacher</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">
                        Semester *
                      </label>
                      <input
                        type="text"
                        value={formData.semester}
                        onChange={(e) =>
                          setFormData({ ...formData, semester: e.target.value })
                        }
                        required
                        className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent"
                        placeholder="e.g., Fall 2024"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">
                        Max Students
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.maxStudents}
                        onChange={(e) =>
                          setFormData({ ...formData, maxStudents: e.target.value })
                        }
                        className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent"
                        placeholder="Leave empty for unlimited"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">
                        Status *
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                        className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent"
                      >
                        <option value="active">Active</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t border-border">
                  <button
                    type="submit"
                    className="flex-1 bg-accent hover:bg-accent-light text-primary font-bold py-3 rounded-md transition-colors"
                  >
                    Create Course
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

export default AdminCourses;