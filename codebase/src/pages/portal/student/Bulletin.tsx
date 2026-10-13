import React, { useEffect, useState } from "react";
import { ExternalLink, Link2 } from "lucide-react";
import pb from "../../../lib/pocketbase";
import PortalLayout from "../../../components/PortalLayout";

const StudentBulletin: React.FC = () => {
  const [items, setItems]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pb.collection("bulletins")
      .getFullList({
        filter: "is_active = true",
        sort: "displayOrder,created",
        requestKey: null,
      })
      .then(data => setItems(data))
      .catch(err => console.error("Failed to load bulletins:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PortalLayout role="student">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h2 className="font-heading font-bold text-2xl text-primary mb-1">Bulletin (Forms & Links)</h2>
          <p className="text-text-muted text-sm">
            Access important forms and links shared by the administration.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-muted">Loading bulletins…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 border border-border rounded-xl bg-surface">
            <Link2 size={48} className="mx-auto text-text-muted/25 mb-4" />
            <p className="text-primary font-semibold text-lg mb-1">No bulletins available.</p>
            <p className="text-sm text-text-muted">Check back later for forms and links from the administration.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, i) => (
              <div
                key={item.id}
                className="border border-border rounded-xl p-5 bg-surface hover:border-accent/50 hover:shadow-sm transition-all duration-200 flex items-start gap-4"
              >
                {/* Index badge */}
                <div className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0 font-heading font-bold text-sm">
                  {i + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-semibold text-primary text-base leading-snug">{item.title}</h3>
                  <p className="text-text-muted text-sm mt-1 leading-relaxed">{item.description}</p>
                </div>

                {/* Button */}
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-2 bg-primary hover:bg-primary-light text-white font-semibold text-sm px-4 py-2 rounded-md transition-all duration-200 hover:scale-105"
                >
                  Open Form
                  <ExternalLink size={13} />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default StudentBulletin;
