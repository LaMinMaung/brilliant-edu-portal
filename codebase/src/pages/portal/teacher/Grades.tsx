import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Award, Filter, Save, CheckCircle } from "lucide-react";
import pb from "../../../lib/pocketbase";
import PortalLayout from "../../../components/PortalLayout";

const TeacherGrades: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCourseId = searchParams.get("course");

  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchTeacherCourses = async () => {
      try {
        const teacherId = pb.authStore.record?.id;
        const coursesData = await pb.collection("courses").getFullList({
          filter: `teacher = "${teacherId}"`,
          sort: "-created",
          requestKey: null,
        });
        setCourses(coursesData);

        if (coursesData.length > 0 && !selectedCourseId) {
          setSearchParams({ course: coursesData[0].id });
        }
      } catch (err) {
        console.error("Error fetching courses:", err);
      }
    };

    fetchTeacherCourses();
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;

    const fetchGradebook = async () => {
      setLoading(true);
      try {
        // Get enrolled students
        const enrollments = await pb.collection("enrollments").getFullList({
          filter: `course = "${selectedCourseId}" && status = "enrolled"`,
          expand: "student",
          requestKey: null,
        });

        // Get all grades for this course
        const gradesData = await pb.collection("grades").getFullList({
          filter: `course = "${selectedCourseId}"`,
          requestKey: null,
        });

        // Map grades by student + type
        const gradesMap = new Map();
        gradesData.forEach((grade) => {
          const key = `${grade.student}-${grade.type}`;
          gradesMap.set(key, grade);
        });

        setStudents(enrollments.map((e) => e.expand?.student).filter(Boolean));
        setGrades(gradesMap);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching gradebook:", err);
        setLoading(false);
      }
    };

    fetchGradebook();
  }, [selectedCourseId]);

  const handleScoreChange = (studentId: string, type: string, value: string) => {
    const key = `${studentId}-${type}`;
    const existingGrade = grades.get(key);
    const score = parseFloat(value) || 0;

    const updatedGrade = existingGrade
      ? { ...existingGrade, score, modified: true }
      : { student: studentId, type, score, modified: true, isNew: true };

    setGrades(new Map(grades.set(key, updatedGrade)));
  };

  const handleSaveGrade = async (studentId: string, type: string) => {
    const key = `${studentId}-${type}`;
    const grade = grades.get(key);
    if (!grade || !grade.modified) return;

    setSaving(new Set(saving.add(key)));

    try {
      const teacherId = pb.authStore.record?.id;

      if (grade.isNew) {
        // Create new grade
        const newGrade = await pb.collection("grades").create({
          student: studentId,
          course: selectedCourseId,
          type,
          score: grade.score,
          maxScore: 100,
          status: "pending",
          gradedBy: teacherId,
          gradedDate: new Date().toISOString().split("T")[0],
        });

        setGrades(
          new Map(
            grades.set(key, { ...newGrade, modified: false, isNew: false })
          )
        );
      } else {
        // Update existing grade
        const updatedGrade = await pb.collection("grades").update(grade.id, {
          score: grade.score,
          gradedBy: teacherId,
          gradedDate: new Date().toISOString().split("T")[0],
        });

        setGrades(
          new Map(grades.set(key, { ...updatedGrade, modified: false }))
        );
      }

      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    } catch (err) {
      console.error("Error saving grade:", err);
      alert("Failed to save grade");
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const handleApproveGrade = async (studentId: string, type: string) => {
    const key = `${studentId}-${type}`;
    const grade = grades.get(key);
    if (!grade || !grade.id) return;

    try {
      const updatedGrade = await pb.collection("grades").update(grade.id, {
        status: "approved",
      });

      setGrades(new Map(grades.set(key, updatedGrade)));
    } catch (err) {
      console.error("Error approving grade:", err);
      alert("Failed to approve grade");
    }
  };

  const assessmentTypes = ["midterm", "final", "quiz", "assignment"];

  const statusStyles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    approved: "bg-green-100 text-green-800 border-green-300",
    rejected: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <PortalLayout role="teacher">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-2">
              Grade Management
            </h2>
            <p className="text-text-muted">Enter and manage student grades</p>
          </div>
        </div>

        {/* Course Filter */}
        <div className="mb-6 flex items-center gap-3">
          <Filter size={18} className="text-secondary" />
          <select
            value={selectedCourseId || ""}
            onChange={(e) => setSearchParams({ course: e.target.value })}
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

        {/* Gradebook Table */}
        {loading ? (
          <p className="text-text-muted text-center py-12">Loading gradebook...</p>
        ) : !selectedCourseId ? (
          <div className="text-center py-12 border border-border rounded-lg bg-surface">
            <Award size={48} className="mx-auto text-text-muted/30 mb-4" />
            <p className="text-text-muted">Select a course to view gradebook</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg bg-surface">
            <Award size={48} className="mx-auto text-text-muted/30 mb-4" />
            <p className="text-text-muted">No students enrolled in this course</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-primary text-white">
                    <th className="text-left px-6 py-3 font-semibold text-sm sticky left-0 bg-primary z-10">
                      Student
                    </th>
                    {assessmentTypes.map((type) => (
                      <th
                        key={type}
                        className="text-center px-4 py-3 font-semibold text-sm capitalize"
                      >
                        {type}
                      </th>
                    ))}
                    <th className="text-center px-4 py-3 font-semibold text-sm">
                      Average
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const studentGrades = assessmentTypes.map((type) => {
                      const key = `${student.id}-${type}`;
                      return grades.get(key);
                    });

                    const validScores = studentGrades
                      .filter((g) => g?.score != null)
                      .map((g) => g.score);
                    const average =
                      validScores.length > 0
                        ? (
                            validScores.reduce((sum, s) => sum + s, 0) /
                            validScores.length
                          ).toFixed(2)
                        : "-";

                    return (
                      <tr
                        key={student.id}
                        className="border-b border-border last:border-0 hover:bg-bg transition-colors"
                      >
                        <td className="px-6 py-4 sticky left-0 bg-surface z-10">
                          <div>
                            <p className="font-semibold text-primary">{student.name}</p>
                            <p className="text-xs text-text-muted">
                              {student.studentId || student.email}
                            </p>
                          </div>
                        </td>
                        {assessmentTypes.map((type) => {
                          const key = `${student.id}-${type}`;
                          const grade = grades.get(key);
                          const isSaving = saving.has(key);

                          return (
                            <td key={type} className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={grade?.score || ""}
                                  onChange={(e) =>
                                    handleScoreChange(student.id, type, e.target.value)
                                  }
                                  className="w-20 border border-border rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-accent"
                                  placeholder="-"
                                />
                                {grade?.modified && (
                                  <button
                                    onClick={() => handleSaveGrade(student.id, type)}
                                    disabled={isSaving}
                                    className="p-1 text-accent hover:text-accent-light transition-colors disabled:opacity-50"
                                    title="Save"
                                  >
                                    <Save size={16} />
                                  </button>
                                )}
                                {grade?.id && grade.status === "pending" && !grade.modified && (
                                  <button
                                    onClick={() => handleApproveGrade(student.id, type)}
                                    className="p-1 text-green-600 hover:text-green-700 transition-colors"
                                    title="Approve"
                                  >
                                    <CheckCircle size={16} />
                                  </button>
                                )}
                                {grade?.status && (
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                      statusStyles[grade.status]
                                    }`}
                                  >
                                    {grade.status[0].toUpperCase()}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td className="px-4 py-4 text-center">
                          <span className="font-bold text-lg text-primary">{average}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default TeacherGrades;