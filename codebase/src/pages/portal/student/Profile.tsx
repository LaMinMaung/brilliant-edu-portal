import React, { useState, useEffect } from "react";
import { User, Mail, Calendar, Save } from "lucide-react";
import pb from "../../../lib/pocketbase";
import PortalLayout from "../../../components/PortalLayout";

const StudentProfile: React.FC = () => {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    studentId: "",
    dateOfBirth: "",
    status: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const user = pb.authStore.record;
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        studentId: user.studentId || "",
        dateOfBirth: user.dateOfBirth || "",
        status: user.status || "active",
      });
    }
    setLoading(false);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const userId = pb.authStore.record?.id;
      await pb.collection("users").update(userId!, {
        name: profile.name,
        dateOfBirth: profile.dateOfBirth,
      });

      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PortalLayout role="student">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="font-heading font-bold text-2xl text-primary mb-2">My Profile</h2>
          <p className="text-text-muted">View and update your personal information</p>
        </div>

        {loading ? (
          <p className="text-text-muted text-center py-12">Loading profile...</p>
        ) : (
          <div className="border border-border rounded-lg bg-surface">
            <div className="p-8">
              <form onSubmit={handleSave} className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-6 pb-6 border-b border-border">
                  <div className="w-20 h-20 rounded-full bg-accent text-primary flex items-center justify-center font-bold text-3xl">
                    {profile.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-xl text-primary">
                      {profile.name}
                    </h3>
                    <p className="text-sm text-text-muted">Student ID: {profile.studentId || "N/A"}</p>
                    <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 border border-green-300 text-xs font-semibold rounded-full capitalize">
                      {profile.status}
                    </span>
                  </div>
                </div>

                {/* Personal Information */}
                <div>
                  <h4 className="font-heading font-semibold text-lg text-primary mb-4">
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                        <input
                          type="text"
                          name="name"
                          value={profile.name}
                          onChange={handleChange}
                          required
                          className="w-full pl-10 pr-4 py-2.5 border border-border rounded-md text-sm text-text bg-bg focus:outline-none focus:border-accent transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                        <input
                          type="email"
                          value={profile.email}
                          disabled
                          className="w-full pl-10 pr-4 py-2.5 border border-border rounded-md text-sm text-text-muted bg-surface cursor-not-allowed"
                        />
                      </div>
                      <p className="text-xs text-text-muted mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">
                        Student ID
                      </label>
                      <input
                        type="text"
                        value={profile.studentId}
                        disabled
                        className="w-full px-4 py-2.5 border border-border rounded-md text-sm text-text-muted bg-surface cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">
                        Date of Birth
                      </label>
                      <div className="relative">
                        <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={profile.dateOfBirth}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 border border-border rounded-md text-sm text-text bg-bg focus:outline-none focus:border-accent transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-6 border-t border-border">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-accent hover:bg-accent-light disabled:opacity-60 text-primary font-bold px-6 py-3 rounded-md transition-colors inline-flex items-center gap-2"
                  >
                    {saving ? "Saving..." : (
                      <>
                        <Save size={18} />
                        Save Changes
                      </>
                    )}
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

export default StudentProfile;
