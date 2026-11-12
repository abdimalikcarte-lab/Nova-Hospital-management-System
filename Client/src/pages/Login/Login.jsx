
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  HeartPulse,
  LockKeyhole,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext.jsx";

export default function Login() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="loading-screen">
        Loading Nova HMS...
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="brand-logo">
          <HeartPulse size={43} />

          <div>
            <h1>NOVA</h1>
            <span>Hospital Management System</span>
          </div>
        </div>

        <div className="login-brand-content">
          <span className="eyebrow">NOVA TECHNOLOGIES</span>

          <h2>
            Better Care.
            <br />
            Smarter Management.
          </h2>

          <p>
            A connected hospital management platform
            designed to support modern healthcare,
            clinical operations and hospital administration.
          </p>
        </div>

        <div className="login-brand-footer">
          <ShieldCheck size={15} />
          <span>SECURE HEALTHCARE MANAGEMENT PLATFORM</span>
        </div>
      </section>

      <section className="login-form-area">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-icon">
            <HeartPulse size={30} />
          </div>

          <span className="eyebrow">HOSPITAL WORKSPACE</span>

          <h2>Welcome Back</h2>

          <p>
            Sign in to access your hospital management workspace.
          </p>

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <label htmlFor="login-email">
            Email Address
          </label>

          <div className="input-with-icon">
            <Mail size={18} />

            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              autoComplete="username"
              required
            />
          </div>

          <label htmlFor="login-password">
            Password
          </label>

          <div className="input-with-icon">
            <LockKeyhole size={18} />

            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((previous) => !previous)}
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          <button
            type="submit"
            className="login-submit"
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>

          <div className="login-security">
            <ShieldCheck size={15} />
            <span>Secure hospital access</span>
          </div>
        </form>
      </section>
    </main>
  );
}
