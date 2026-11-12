
import { useEffect, useState } from "react";
import {
  Users, CalendarDays, BedDouble, Stethoscope,
  RefreshCw, UserRound, Activity, Wallet,
} from "lucide-react";

import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const initialStats = {
  totalPatients: 0,
  totalDoctors: 0,
  todayAppointments: 0,
  currentAdmissions: 0,
  unpaidInvoices: 0,
  invoiceValue: 0,
};

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <article className={`stat-card ${color}`}>
      <div className="stat-card-top">
        <span>{title}</span>
        <div className="stat-icon"><Icon size={23} /></div>
      </div>
      <strong>{Number(value || 0).toLocaleString()}</strong>
      <span className="stat-caption">Live database records</span>
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
      setStats(result.stats || initialStats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [hospital?.id]);

  const cards = [
    { title: "Total Patients", value: stats.totalPatients, icon: Users, color: "navy" },
    { title: "Today's Appointments", value: stats.todayAppointments, icon: CalendarDays, color: "orange" },
    { title: "Current Admissions", value: stats.currentAdmissions, icon: BedDouble, color: "red" },
    { title: "Active Doctors", value: stats.totalDoctors, icon: Stethoscope, color: "purple" },
  ];

  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">HOSPITAL OVERVIEW</span>
          <h1>Welcome back, {user?.fullName || "User"}!</h1>
          <p>Here is your hospital's current operational overview.</p>
        </div>

        <button className="refresh-button" onClick={loadDashboard} disabled={loading}>
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="dashboard-hospital-banner">
        <div>
          <span>ACTIVE HOSPITAL</span>
          <h2>{hospital?.name || "Hospital workspace"}</h2>
          <p>Hospital data is isolated to your authorized workspace.</p>
        </div>
        <Activity size={35} />
      </div>

      {error && (
        <div className="dashboard-error">
          <strong>Dashboard could not load.</strong>
          <span>{error}</span>
          <button onClick={loadDashboard}>Try again</button>
        </div>
      )}

      <div className="stats-grid">
        {cards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="panel patient-overview">
          <div className="panel-heading">
            <div>
              <h2>Hospital Activity</h2>
              <p>Operational summary from the database</p>
            </div>
            <Activity size={21} />
          </div>

          <div className="activity-empty">
            <div className="activity-icon"><Activity size={30} /></div>
            <h3>Activity analytics</h3>
            <p>
              Patient registration trends, appointments and clinical
              activity will appear here as those records are added.
            </p>
          </div>
        </section>

        <section className="panel performance-panel">
          <div className="panel-heading">
            <div>
              <h2>Financial Snapshot</h2>
              <p>Invoice overview</p>
            </div>
            <Wallet size={21} />
          </div>

          <div className="financial-value">
            <span>Outstanding invoices</span>
            <strong>{loading ? "..." : stats.unpaidInvoices.toLocaleString()}</strong>
          </div>

          <div className="financial-value">
            <span>Total invoice value</span>
            <strong>
              {loading
                ? "..."
                : stats.invoiceValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
            </strong>
          </div>

          <p className="financial-note">
            Amounts are shown in the database's configured currency.
          </p>
        </section>

        <section className="panel quick-panel">
          <div className="panel-heading">
            <div>
              <h2>Phase 1 Workspace</h2>
              <p>Core system foundation</p>
            </div>
            <UserRound size={21} />
          </div>

          <div className="quick-row">
            <span>Authentication</span><b>Enabled</b>
          </div>
          <div className="quick-row">
            <span>Hospital workspace</span><b>{hospital ? "Selected" : "Not selected"}</b>
          </div>
          <div className="quick-row">
            <span>Role permissions</span><b>Server verified</b>
          </div>
          <div className="quick-row">
            <span>Patient module</span><b>Phase 2</b>
          </div>
        </section>

        <section className="panel empty-appointments">
          <div className="panel-heading">
            <div>
              <h2>Today's Appointments</h2>
              <p>Appointments scheduled for today</p>
            </div>
            <CalendarDays size={21} />
          </div>
          <div className="empty-message">
            {loading ? "Loading appointments..." : "Appointment list will appear here."}
          </div>
        </section>
      </div>
    </div>
  );
}

