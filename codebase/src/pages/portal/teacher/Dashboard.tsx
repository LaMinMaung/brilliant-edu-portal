import React from "react";
import { BookOpen, Users, FileText } from "lucide-react";
import PortalLayout from "../../../components/PortalLayout";

const TeacherDashboard: React.FC = () => {
  return (
    <PortalLayout role="teacher">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="font-heading font-bold text-2xl text-primary mb-2">Teacher Dashboard</h2>
          <p className="text-text-muted">Manage your courses, students, and grades</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: <BookOpen size={24} />, label: "My Courses", value: "3" },
            { icon: <Users size={24} />, label: "Total Students", value: "42" },
            { icon: <FileText size={24} />, label: "Pending Grades", value: "8" },
          ].map((stat) => (
            <div key={stat.label} className="border border-border rounded-lg p-6 bg-surface">
              <div className="w-12 h-12 rounded-md bg-accent/10 text-accent flex items-center justify-center mb-4">
                {stat.icon}
              </div>
              <p className="text-text-muted text-sm mb-1">{stat.label}</p>
              <p className="font-heading font-bold text-2xl text-primary">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </PortalLayout>
  );
};

export default TeacherDashboard;