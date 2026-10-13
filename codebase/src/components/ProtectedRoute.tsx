import React from "react";
import { Navigate } from "react-router-dom";
import pb from "../lib/pocketbase";

interface Props {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
  const user = pb.authStore.record;

  if (!pb.authStore.isValid) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-4">
        <div className="text-center">
          <h1 className="font-heading font-bold text-3xl text-primary mb-4">Unauthorized</h1>
          <p className="text-text-muted mb-8">You don't have permission to access this page.</p>
          <a
            href="/"
            className="inline-block bg-primary hover:bg-primary-light text-white font-semibold px-6 py-3 rounded-md transition-colors"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;