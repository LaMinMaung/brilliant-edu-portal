import React from "react";
import { Link } from "react-router-dom";

const NotFound: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center px-4 bg-bg">
    <div className="text-center">
      <h1 className="font-heading font-bold text-7xl text-primary mb-2">404</h1>
      <div className="w-16 h-1 bg-accent mx-auto mb-4 rounded-full" />
      <p className="text-text-muted text-lg mb-8">
        The page you're looking for doesn't exist.
      </p>
      <Link
        to="/"
        className="bg-primary hover:bg-primary-light text-white font-semibold px-6 py-3 rounded-md transition-all duration-300 hover:scale-105"
      >
        Back to Home
      </Link>
    </div>
  </div>
);

export default NotFound;