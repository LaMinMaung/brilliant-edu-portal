import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Globe, Image } from "lucide-react";
import pb from "../../../lib/pocketbase";
import PortalLayout from "../../../components/PortalLayout";

const AdminCollaborators: React.FC = () => {
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    status: "active",
    displayOrder: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await pb.collection("collaborators").getFullList({
        sort: "displayOrder,name",
        requestKey: null,
      });
      setCollaborators(data);
    } catch (err) {
      console.error("Error fetching collaborators:", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingRecord(null);
    setFormData({ name: "", status: "active", displayOrder: "" });
    setLogoFile(null);
    setLogoPreview(null);
    setShowModal(true);
  };

  const openEdit = (record: any) => {
    setEditingRecord(record);
    setFormData({
      name: record.name,
      status: record.status,
      displayOrder: record.displayOrder != null ? String(record.displayOrder) : "",
    });
    setLogoFile(null);
    setLogoPreview(
      record.logo ? pb.files.getURL(record, record.logo, { thumb: "200x200" }) : null
    );
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRecord(null);
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord && !logoFile) {
      alert("Please upload a logo image.");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("status", formData.status);
      if (formData.displayOrder !== "") {
        fd.append("displayOrder", formData.displayOrder);
      }
      if (logoFile) {
        fd.append("logo", logoFile);
      }

      if (editingRecord) {
        await pb.collection("collaborators").update(editingRecord.id, fd);
      } else {
        await pb.collection("collaborators").create(fd);
      }

      await fetchData();
      closeModal();
    } catch (err: any) {
      console.error("Error saving collaborator:", err);
      alert(err.message || "Failed to save collaborator. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this partner institution?")) return;
    try {
      await pb.collection("collaborators").delete(id);
      setCollaborators((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Error deleting collaborator:", err);
      alert("Failed to delete partner institution.");
    }
  };

  const statusStyles: Record<string, string> = {
    active: "bg-green-100 text-green-800 border-green-300",
    inactive: "bg-gray-100 text-gray-800 border-gray-300",
  };

  return (
    <PortalLayout role="admin">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-2">
              Partner Institutions
            </h2>
            <p className="text-text-muted">
              Manage collaborator schools and universities shown on the About page
            </p>
          </div>
          <button
            onClick={openCreate}
            className="bg-accent hover:bg-accent-light text-primary font-semibold px-6 py-2.5 rounded-md transition-colors inline-flex items-center gap-2"
          >
            <Plus size={18} />
            Add Partner
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Partners", value: collaborators.length, color: "text-primary" },
            {
              label: "Active",
              value: collaborators.filter((c) => c.status === "active").length,
              color: "text-green-600",
            },
            {
              label: "Inactive",
              value: collaborators.filter((c) => c.status === "inactive").length,
              color: "text-gray-500",
            },
          ].map((stat) => (
            <div key={stat.label} className="border border-border rounded-lg p-4 bg-surface">
              <p className="text-sm text-text-muted mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-text-muted text-center py-12">Loading partner institutions...</p>
        ) : collaborators.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg bg-surface">
            <Globe size={48} className="mx-auto text-text-muted/30 mb-4" />
            <p className="text-text-muted mb-4">No partner institutions added yet</p>
            <button
              onClick={openCreate}
              className="bg-primary hover:bg-primary-light text-white font-semibold px-6 py-2.5 rounded-md transition-colors"
            >
              Add First Partner
            </button>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-primary text-white">
                    <th className="text-left px-6 py-3 font-semibold text-sm">Logo</th>
                    <th className="text-left px-6 py-3 font-semibold text-sm">Institution Name</th>
                    <th className="text-center px-6 py-3 font-semibold text-sm">Status</th>
                    <th className="text-center px-6 py-3 font-semibold text-sm">Order</th>
                    <th className="text-center px-6 py-3 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {collaborators.map((collab) => (
                    <tr
                      key={collab.id}
                      className="border-b border-border last:border-0 hover:bg-bg transition-colors"
                    >
                      <td className="px-6 py-4">
                        {collab.logo ? (
                          <img
                            src={pb.files.getURL(collab, collab.logo, { thumb: "80x80" })}
                            alt={collab.name}
                            className="w-16 h-12 object-contain rounded border border-border bg-bg p-1"
                          />
                        ) : (
                          <div className="w-16 h-12 rounded border border-border bg-bg flex items-center justify-center">
                            <Image size={20} className="text-text-muted/40" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-primary">{collab.name}</td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize ${
                            statusStyles[collab.status]
                          }`}
                        >
                          {collab.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-text-muted">
                        {collab.displayOrder != null && collab.displayOrder !== 0
                          ? collab.displayOrder
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEdit(collab)}
                            className="p-2 text-secondary hover:text-primary transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(collab.id)}
                            className="p-2 text-red-500 hover:text-red-700 transition-colors"
                            title="Delete"
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
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-primary/50 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-lg max-h-[90vh] bg-bg rounded-lg border border-border overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border bg-surface">
              <h3 className="font-heading font-bold text-xl text-primary">
                {editingRecord ? "Edit Partner Institution" : "Add New Partner Institution"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">
                  Institution Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent transition-colors"
                  placeholder="e.g., University of Mandalay"
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">
                  Logo Image{" "}
                  {!editingRecord && <span className="text-red-500">*</span>}
                </label>
                {logoPreview && (
                  <div className="mb-3 p-3 border border-border rounded-md bg-surface inline-block">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-20 object-contain"
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  onChange={handleLogoChange}
                  className="w-full text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-primary hover:file:bg-accent/20 cursor-pointer"
                />
                {editingRecord && (
                  <p className="text-xs text-text-muted mt-1">
                    Leave empty to keep the existing logo
                  </p>
                )}
                <p className="text-xs text-text-muted mt-1">
                  Accepted: JPG, PNG, WEBP, GIF, SVG
                </p>
              </div>

              {/* Status & Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent transition-colors"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, displayOrder: e.target.value })
                    }
                    className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent transition-colors"
                    placeholder="Optional (e.g., 1)"
                  />
                  <p className="text-xs text-text-muted mt-1">Lower numbers appear first</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-border">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-60 text-primary font-bold py-3 rounded-md transition-colors"
                >
                  {saving
                    ? "Saving..."
                    : editingRecord
                    ? "Update Partner"
                    : "Add Partner"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 rounded-md border border-border text-text-muted hover:text-primary hover:border-primary font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default AdminCollaborators;
