import React, { useEffect, useState } from "react";
import { Users, Mail, Phone, Filter } from "lucide-react";
import pb from "../../../lib/pocketbase";
import PortalLayout from "../../../components/PortalLayout";

const TeacherStudents: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

    const fetchStudents = async () => {
      setLoading(true);
      try {
        const enrollments = await pb.collection("enrollments").getFullList({
          filter: `course = "${selectedCourse}" && status = "enrolled"`,
          expand: "student",
          sort: "enrolledDate",
          requestKey: null,
        });

        const studentsData = enrollments
          .map((e) => ({
            ...e.expand?.student,
            enrolledDate: e.enrolledDate,
            enrollmentId: e.id,
          }))
          .filter(Boolean);

        setStudents(studentsData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching students:", err);
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedCourse]);

  const selectedCourseData = courses.find((c) => c.id === selectedCourse);

  return (
    <PortalLayout role="teacher">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="font-heading font-bold text-2xl text-primary mb-2">
            Students
          </h2>
          <p className="text-text-muted">View enrolled students by course</p>
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

        {/* Course Info */}
        {selectedCourseData && (
          <div className="mb-6 p-4 bg-surface border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-primary">
                  {selectedCourseData.code} - {selectedCourseData.title}
                </h3>
                <p className="text-sm text-text-muted mt-1">
                  {selectedCourseData.semester} • {students.length} enrolled
                </p>
              </div>
              <span className="text-2xl font-bold text-accent">{students.length}</span>
            </div>
          </div>
        )}

        {/* Students List */}
        {loading ? (
          <p className="text-text-muted text-center py-12">Loading students...</p>
        ) : !selectedCourse ? (
          <div className="text-center py-12 border border-border rounded-lg bg-surface">
            <Users size={48} className="mx-auto text-text-muted/30 mb-4" />
            <p className="text-text-muted">Select a course to view students</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg bg-surface">
            <Users size={48} className="mx-auto text-text-muted/30 mb-4" />
            <p className="text-text-muted">No students enrolled in this course</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-primary text-white">
                    <th className="text-left px-6 py-3 font-semibold text-sm">
                      Student ID
                    </th>
                    <th className="text-left px-6 py-3 font-semibold text-sm">Name</th>
                    <th className="text-left px-6 py-3 font-semibold text-sm">Email</th>
                    <th className="text-left px-6 py-3 font-semibold text-sm">
                      Phone
                    </th>
                    <th className="text-left px-6 py-3 font-semibold text-sm">
                      Enrolled Date
                    </th>
                    <th className="text-center px-6 py-3 font-semibold text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b border-border last:border-0 hover:bg-bg transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-primary">
                        {student.studentId || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent text-primary flex items-center justify-center font-bold text-sm">
                            {student.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <span className="font-semibold text-primary">
                            {student.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-muted">
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-secondary" />
                          {student.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-muted">
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-secondary" />
                          {student.phone || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-muted">
                        {student.enrolledDate
                          ? new Date(student.enrolledDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="text-sm text-secondary hover:text-primary font-medium transition-colors">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default TeacherStudents;