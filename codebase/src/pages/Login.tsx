import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, AlertCircle } from "lucide-react";
import pb from "../lib/pocketbase";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("session_expired") === "1") {
      setSessionExpired(true);
      localStorage.removeItem("session_expired");
    }
    // Redirect if already logged in
    if (pb.authStore.isValid) {
      const role = pb.authStore.record?.role;
      redirectByRole(role);
    }
  }, []);

  const redirectByRole = (role: string) => {
    if (role === "student")           navigate("/portal/student/dashboard");
    else if (role === "teacher")      navigate("/portal/teacher/dashboard");
    else if (role === "admin")        navigate("/portal/admin/dashboard");
    else if (role === "information_admin") navigate("/portal/admin/information-programs");
    else navigate("/");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const auth = await pb.collection("users").authWithPassword(email, password);
      const role = auth.record.role;

      if (!role) {
        setError("User role not assigned. Please contact administrator.");
        pb.authStore.clear();
        setLoading(false);
        return;
      }

      // Fire-and-forget login log
      try {
        await pb.collection("activity_logs").create({
          user_id:   auth.record.id,
          user_name: auth.record.name || auth.record.email || "Unknown",
          role:      auth.record.role || "unknown",
          action:    "login",
          details:   `Logged in successfully`,
          device:    navigator.userAgent,
        });
      } catch { /* logging must never block login */ }

      redirectByRole(role);
    } catch (err: any) {
      console.error("Login error:", err);
      setError("Invalid email or password. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/public_2f04_d65151668d134695a02f5df6d68aeba8.png"
            alt="BEI Logo"
            className="h-20 w-auto mx-auto mb-4"
          />
          <h1 className="font-heading font-bold text-2xl text-primary">Student Portal Login</h1>
          <p className="text-text-muted text-sm mt-2">Access your courses, grades, and more</p>
        </div>

        {/* Login Form */}
        <div className="border border-border rounded-lg p-8 bg-surface">
          <form onSubmit={handleLogin} className="space-y-5">
          {sessionExpired && (
              <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 text-orange-800 rounded-md text-sm mb-4">
                <AlertCircle size={18} className="shrink-0" />
                Your session expired after 2 hours of inactivity. Please log in again.
              </div>
            )}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent transition-colors"
                placeholder="student@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-border rounded-md px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:border-accent transition-colors"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-light disabled:opacity-60 text-white font-semibold py-3 rounded-md transition-all duration-300 inline-flex items-center justify-center gap-2"
            >
              {loading ? "Signing in..." : (
                <>
                  Sign In <LogIn size={18} />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Login;