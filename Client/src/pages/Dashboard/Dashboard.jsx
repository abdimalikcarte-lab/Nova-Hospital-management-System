
import { useEffect, useState } from "react";
import {
  Users,
  CalendarDays,
  BedDouble,
  Stethoscope,
  RefreshCw,
  Activity,
  Wallet,
  AlertCircle,
} from "lucide-react";

import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

const initialStats = {
  totalPatients: 0,
  totalDoctors: 0,
  todayAppointments: 0,
  currentAdmissions: 0,
  unpaidInvoices: 0,
  invoiceValue: 0,
};

function StatCard({ title, value, icon: Icon, color, loading }) {
  return (
    <article className={`stat-card ${color}`}>
      <div className="stat-card-top">
        <span>{title}</span>

        <div className="stat-icon">
          <Icon size={23} />
        </div>
      </div>

      <strong>
        {loading
          ? "..."
          : Number(value || 0).toLocaleString()}
      </strong>

      <span className="stat-caption">
        Hospital database records
      </span>
    </article>
  );
}

export default function Dashboard() {
  const { user, hospital } = useAuth();

  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const result = await api.get("/api/dashboard");

      setStats({
        ...initialStats,
        ...(result.stats || {}),
      });
    } catch (err) {
      setError(
        err.message || "Unable to load dashboard information."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [hospital?.id]);

  const cards = [
    {
      title: "Total Patients",
      value: stats.totalPatients,
      icon: Users,
      color: "navy",
    },
    {
      title: "Today's Appointments",
      value: stats.todayAppointments,
      icon: CalendarDays,
      color: "orange",
    },
    {
      title: "Current Admissions",
      value: stats.currentAdmissions,
      icon: BedDouble,
      color: "red",
    },
    {
      title: "Active Doctors",
      value: stats.totalDoctors,
      icon: Stethoscope,
      color: "purple",
    },
  ];

  return (
    <main className="dashboard-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">HOSPITAL OVERVIEW</span>

          <h1>
            Welcome back, {user?.fullName || "User"}!
          </h1>

          <p>
            Monitor your hospital operations from one workspace.
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={loadDashboard}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? "spin" : ""}
          />
          Refresh
        </button>
      </header>

      <section className="dashboard-hospital-banner">
        <div>
          <span>ACTIVE HOSPITAL</span>

          <h2>
            {hospital?.name || "Hospital workspace"}
          </h2>

          <p>
            Information from your authorized hospital workspace.
          </p>
        </div>

        <Activity size={35} />
      </section>

      {error && (
        <div className="dashboard-error" role="alert">
          <AlertCircle size={20} />

          <div>
            <strong>Dashboard data unavailable</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
          >
            Try again
          </button>
        </div>
      )}

      <section className="stats-grid">
        {cards.map((card) => (
          <StatCard
            key={card.title}
            {...card}
            loading={loading}
          />
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel patient-overview">
          <div className="panel-heading">
            <div>
              <h2>Hospital Activity</h2>
              <p>Operational activity overview</p>
            </div>

            <Activity size={21} />
          </div>

          <div className="activity-empty">
            <div className="activity-icon">
              <Activity size={30} />
            </div>

            <h3>Activity Analytics</h3>

            <p>
              Patient registration trends, appointments and
              clinical activity will appear here when the
              relevant database records are available.
            </p>
          </div>
        </article>

        <article className="panel performance-panel">
          <div className="panel-heading">
            <div>
              <h2>Financial Snapshot</h2>
              <p>Invoice overview</p>
            </div>

            <Wallet size={21} />
          </div>

          <div className="financial-value">
            <span>Outstanding invoices</span>

            <strong>
              {loading
                ? "..."
                : Number(stats.unpaidInvoices || 0).toLocaleString()}
            </strong>
          </div>

          <div className="financial-value">
            <span>Total invoice value</span>

            <strong>
              {loading
                ? "..."
                : Number(stats.invoiceValue || 0).toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
            </strong>
          </div>

          <p className="financial-note">
            Currency will follow the hospital's financial settings.
          </p>
        </article>

        <article className="panel quick-panel">
          <div className="panel-heading">
            <div>
              <h2>System Foundation</h2>
              <p>Core platform status</p>
            </div>

            <Users size={21} />
          </div>

          <div className="quick-row">
            <span>Authentication</span>
            <b>Enabled</b>
          </div>

          <div className="quick-row">
            <span>Hospital workspace</span>
            <b>{hospital ? "Selected" : "Not selected"}</b>
          </div>

          <div className="quick-row">
            <span>Role permissions</span>
            <b>RBAC</b>
          </div>

          <div className="quick-row">
            <span>Dashboard API</span>
            <b>{error ? "Unavailable" : loading ? "Checking..." : "Responded"}</b>
          </div>
        </article>

        <article className="panel empty-appointments">
          <div className="panel-heading">
            <div>
              <h2>Today's Appointments</h2>
              <p>Scheduled hospital appointments</p>
            </div>

            <CalendarDays size={21} />
          </div>

          <div className="empty-message">
            {loading
              ? "Loading appointments..."
              : "Appointment records will appear here."}
          </div>
        </article>
      </section>
    </main>
  );
}
