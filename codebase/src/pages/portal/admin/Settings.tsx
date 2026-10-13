import React from "react";
import { Save } from "lucide-react";
import PortalLayout from "../../../components/PortalLayout";

const AdminSettings: React.FC = () => {
  return (
    <PortalLayout role="admin">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="font-heading font-bold text-2xl text-primary mb-2">
            System Settings
          </h2>
          <p className="text-text-muted">Configure system-wide settings and preferences</p>
        </div>

        <div className="space-y-6">
          {/* General Settings */}
          <div className="border border-border rounded-lg p-6 bg-surface">
            <h3 className="font-heading font-semibold text-lg text-primary mb-4">
              General Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">
                  Institution Name
                </label>
                <input
                  type="text"
                  defaultValue="Brilliant Educational Institute"
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">
                  Academic Year
                </label>
                <input
                  type="text"
                  defaultValue="2024-2025"
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">
                  Current Semester
                </label>
                <select className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent">
                  <option>Fall 2024</option>
                  <option>Spring 2025</option>
                  <option>Summer 2025</option>
                </select>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button className="bg-accent hover:bg-accent-light text-primary font-bold px-6 py-3 rounded-md transition-colors inline-flex items-center gap-2">
              <Save size={18} />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default AdminSettings;
