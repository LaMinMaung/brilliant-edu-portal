import React from "react";
import { Users, BookOpen, ClipboardList } from "lucide-react";
import PortalLayout from "../../../components/PortalLayout";

const AdminDashboard: React.FC = () => {
  return (
    <PortalLayout role="admin">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="font-heading font-bold text-2xl text-primary mb-2">Admin Dashboard</h2>
          <p className="text-text-muted">System overview and management</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: <Users size={24} />, label: "Total Users", value: "127" },
            { icon: <BookOpen size={24} />, label: "Active Courses", value: "18" },
            { icon: <ClipboardList size={24} />, label: "Pending Enrollments", value: "5" },
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

export default AdminDashboard;