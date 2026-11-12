
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { HeartPulse, LockKeyhole, Mail, Eye, EyeOff } from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
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
            <span>Hospital Management</span>
          </div>
        </div>

        <div className="login-brand-content">
          <h2>Better Care.<br />Smarter Management.</h2>
          <p>
            A connected hospital management platform
            designed to support modern healthcare.
          </p>
        </div>

        <span className="login-brand-footer">
          NOVA TECHNOLOGIES · NOVA HMS
        </span>
      </section>

      <section className="login-form-area">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-icon">
            <HeartPulse size={30} />
          </div>

          <h2>Welcome Back</h2>
          <p>Sign in to access your hospital workspace.</p>

          {error && <div className="form-error">{error}</div>}

          <label>Email Address</label>
          <div className="input-with-icon">
            <Mail size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="username"
              required
            />
          </div>

          <label>Password</label>
          <div className="input-with-icon">
            <LockKeyhole size={18} />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button className="login-submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign In"}
          </button>

          <div className="login-security">
            <LockKeyhole size={14} />
            Secure hospital access
          </div>
        </form>
      </section>
    </main>
  );
}
