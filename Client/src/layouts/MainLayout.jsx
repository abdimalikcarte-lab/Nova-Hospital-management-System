import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Activity, Bell, BedDouble, CalendarDays, ChevronDown,
  ClipboardList, CreditCard, FileText, FlaskConical,
  HeartPulse, LayoutDashboard, LogOut, Menu, Moon,
  Pill, Settings, ShieldCheck, Stethoscope, Users, X,
  Building2, UserCog, BarChart3
} from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";

const navigation = [
  {
    title: "MAIN",
    items: [
      { label: "Dashboard", path: "/", icon: LayoutDashboard, permission: "dashboard.view" },
      { label: "Patients", path: "/patients", icon: Users, permission: "patients.view" },
      { label: "Appointments", path: "/appointments", icon: CalendarDays, permission: "appointments.view" },
      { label: "Doctors", path: "/doctors", icon: Stethoscope, permission: "doctors.view" },
      { label: "Departments", path: "/departments", icon: Building2, permission: "departments.view" },
    ],
  },
  {
    title: "CLINICAL",
    items: [
      { label: "Medical Records", path: "/medical-records", icon: ClipboardList, permission: "patients.view" },
      { label: "Laboratory", path: "/laboratory", icon: FlaskConical, permission: "patients.view" },
      { label: "Pharmacy", path: "/pharmacy", icon: Pill, permission: "patients.view" },
      { label: "Admissions", path: "/admissions", icon: BedDouble, permission: "patients.view" },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { label: "Billing", path: "/billing", icon: CreditCard, permission: "billing.view" },
      { label: "Reports", path: "/reports", icon: BarChart3, permission: "reports.view" },
      { label: "Users & Roles", path: "/users", icon: UserCog, permission: "users.view" },
      { label: "Settings", path: "/settings", icon: Settings, permission: "settings.view" },
    ],
  },
];

export default function MainLayout() {
  const { user, hospital, hospitals, logout, switchHospital, hasPermission } = useAuth();

  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [hospitalOpen, setHospitalOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  async function handleHospitalChange(id) {
    setSwitching(true);
    try {
      await switchHospital(id);
      setHospitalOpen(false);
      navigate("/");
    } catch (error) {
      alert(error.message);
    } finally {
      setSwitching(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-symbol"><HeartPulse size={36} /></div>
          <div>
            <h2>NOVA</h2>
            <span>Hospital Management</span>
          </div>
          <button className="mobile-close" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((group) => {
            const visibleItems = group.items.filter((item) =>
              hasPermission(item.permission)
            );

            if (!visibleItems.length) return null;

            return (
              <div className="nav-group" key={group.title}>
                <span className="nav-group-title">{group.title}</span>

                {visibleItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/"}
                      className={({ isActive }) =>
                        `nav-link ${isActive ? "active" : ""}`
                      }
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon size={19} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-promo">
          <HeartPulse size={27} />
          <h3>Nova Health</h3>
          <p>Better Care. Healthier Life.</p>
        </div>

        <div className="sidebar-footer">
          <ShieldCheck size={15} />
          <span>Secure Hospital Workspace</span>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="main-area">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div className="topbar-search">
            <Users size={19} />
            <input placeholder="Search patients, doctors, or records..." />
          </div>

          <div className="topbar-actions">
            <button className="icon-button notification-button" title="Notifications">
              <Bell size={21} />
            </button>

            <button className="icon-button" title="Appearance">
              <Moon size={21} />
            </button>

            <div className="dropdown-wrapper">
              <button
                className="hospital-selector"
                onClick={() => {
                  setHospitalOpen(!hospitalOpen);
                  setProfileOpen(false);
                }}
              >
                <Building2 size={19} />
                <span>{hospital?.name || "Select Hospital"}</span>
                <ChevronDown size={16} />
              </button>

              {hospitalOpen && (
                <div className="dropdown-menu hospital-dropdown">
                  <strong>Your Hospitals</strong>
                  {hospitals.map((item) => (
                    <button
                      key={item.id}
                      disabled={switching || item.id === hospital?.id}
                      onClick={() => handleHospitalChange(item.id)}
                    >
                      {item.name}
                      {item.id === hospital?.id && " ✓"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="dropdown-wrapper">
              <button
                className="profile-button"
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setHospitalOpen(false);
                }}
              >
                <div className="avatar">
                  {(user?.fullName || "U").charAt(0).toUpperCase()}
                </div>
                <div className="profile-info">
                  <strong>{user?.fullName || "User"}</strong>
                  <span>{user?.isPlatformAdmin ? "Super Admin" : "Hospital User"}</span>
                </div>
                <ChevronDown size={16} />
              </button>

              {profileOpen && (
                <div className="dropdown-menu profile-dropdown">
                  <strong>{user?.email}</strong>
                  <button onClick={handleLogout}>
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="page-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
