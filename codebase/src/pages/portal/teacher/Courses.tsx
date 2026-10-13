import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Users, FileText, Settings } from "lucide-react";
import pb from "../../../lib/pocketbase";
import PortalLayout from "../../../components/PortalLayout";

const TeacherCourses: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
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

        // Get enrollment counts for each course
        const coursesWithStats = await Promise.all(
          coursesData.map(async (course) => {
            const enrollments = await pb.collection("enrollments").getFullList({
              filter: `course = "${course.id}" && status = "enrolled"`,
              requestKey: null,
            });

            const pendingGrades = await pb.collection("grades").getFullList({
              filter: `course = "${course.id}" && status = "pending"`,
              requestKey: null,
            });

            return {
              ...course,
              enrolledCount: enrollments.length,
              pendingGradesCount: pendingGrades.length,
            };
          })
        );

        setCourses(coursesWithStats);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const statusStyles: Record<string, string> = {
    active: "bg-green-100 text-green-800 border-green-300",
    completed: "bg-gray-100 text-gray-800 border-gray-300",
    upcoming: "bg-blue-100 text-blue-800 border-blue-300",
  };

  return (
    <PortalLayout role="teacher">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-2">My Courses</h2>
            <p className="text-text-muted">Courses you are teaching this semester</p>
          </div>
          <button className="bg-accent hover:bg-accent-light text-primary font-semibold px-6 py-2.5 rounded-md transition-colors">
            Request New Course
          </button>
        </div>

        {loading ? (
          <p className="text-text-muted text-center py-12">Loading courses...</p>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg bg-surface">
            <BookOpen size={48} className="mx-auto text-text-muted/30 mb-4" />
            <p className="text-text-muted mb-4">You are not assigned to any courses yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="border border-border rounded-lg bg-surface hover:border-accent transition-colors duration-300"
              >
                <div className="p-6 border-b border-border">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs font-semibold text-secondary">{course.code}</span>
                      <h3 className="font-heading font-semibold text-lg text-primary mt-1">
                        {course.title}
                      </h3>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        statusStyles[course.status]
                      }`}
                    >
                      {course.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted mb-4">
                    {course.semester} • {course.credits} Credits
                  </p>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center py-3 bg-bg rounded-md border border-border">
                      <Users size={20} className="mx-auto text-secondary mb-1" />
                      <p className="text-xl font-bold text-primary">{course.enrolledCount}</p>
                      <p className="text-xs text-text-muted">Students</p>
                    </div>
                    <div className="text-center py-3 bg-bg rounded-md border border-border">
                      <FileText size={20} className="mx-auto text-accent mb-1" />
                      <p className="text-xl font-bold text-primary">{course.pendingGradesCount}</p>
                      <p className="text-xs text-text-muted">Pending</p>
                    </div>
                    <div className="text-center py-3 bg-bg rounded-md border border-border">
                      <BookOpen size={20} className="mx-auto text-sky mb-1" />
                      <p className="text-xl font-bold text-primary">
                        {course.maxStudents || "∞"}
                      </p>
                      <p className="text-xs text-text-muted">Max</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 flex gap-2">
                  <Link
                    to={`/portal/teacher/grades?course=${course.id}`}
                    className="flex-1 text-center px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-md text-sm font-medium transition-colors"
                  >
                    Gradebook
                  </Link>
                  <button className="px-4 py-2 border border-border text-text-muted hover:border-primary hover:text-primary rounded-md text-sm font-medium transition-colors">
                    <Settings size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default TeacherCourses;