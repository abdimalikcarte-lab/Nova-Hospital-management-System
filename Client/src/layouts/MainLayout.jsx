
import { useEffect, useRef, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Bell,
  BedDouble,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FlaskConical,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Pill,
  Settings,
  ShieldCheck,
  Stethoscope,
  Users,
  X,
  Building2,
  UserCog,
  BarChart3,
} from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";

const navigation = [
  {
    title: "MAIN",
    items: [
      {
        label: "Dashboard",
        path: "/",
        icon: LayoutDashboard,
        permission: "dashboard.view",
      },
      {
        label: "Patients",
        path: "/patients",
        icon: Users,
        permission: "patients.view",
      },
      {
        label: "Appointments",
        path: "/appointments",
        icon: CalendarDays,
        permission: "appointments.view",
      },
      {
        label: "Doctors",
        path: "/doctors",
        icon: Stethoscope,
        permission: "doctors.view",
      },
      {
        label: "Departments",
        path: "/departments",
        icon: Building2,
        permission: "departments.view",
      },
    ],
  },
  {
    title: "CLINICAL",
    items: [
      {
        label: "Medical Records",
        path: "/medical-records",
        icon: ClipboardList,
        permission: "patients.view",
      },
      {
        label: "Laboratory",
        path: "/laboratory",
        icon: FlaskConical,
        permission: "patients.view",
      },
      {
        label: "Pharmacy",
        path: "/pharmacy",
        icon: Pill,
        permission: "patients.view",
      },
      {
        label: "Admissions",
        path: "/admissions",
        icon: BedDouble,
        permission: "patients.view",
      },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      {
        label: "Billing",
        path: "/billing",
        icon: CreditCard,
        permission: "billing.view",
      },
      {
        label: "Reports",
        path: "/reports",
        icon: BarChart3,
        permission: "reports.view",
      },
      {
        label: "Users & Roles",
        path: "/users",
        icon: UserCog,
        permission: "users.view",
      },
      {
        label: "Settings",
        path: "/settings",
        icon: Settings,
        permission: "settings.view",
      },
    ],
  },
];

export default function MainLayout() {
  const {
    user,
    hospital,
    hospitals,
    logout,
    switchHospital,
    hasPermission,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [hospitalOpen, setHospitalOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const dropdownRef = useRef(null);

  // Close menus when route changes
  useEffect(() => {
    setSidebarOpen(false);
    setProfileOpen(false);
    setHospitalOpen(false);
  }, [location.pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
        setHospitalOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  function closeMenus() {
    setProfileOpen(false);
    setHospitalOpen(false);
  }

  async function handleHospitalChange(hospitalId) {
    if (switching) return;

    setSwitching(true);

    try {
      await switchHospital(hospitalId);

      closeMenus();
      navigate("/", { replace: true });
    } catch (error) {
      window.alert(
        error.message || "Unable to switch hospital."
      );
    } finally {
      setSwitching(false);
    }
  }

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      window.alert(
        error.message || "Unable to sign out."
      );
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="app-shell">

      {/* SIDEBAR */}
      <aside
        className={`sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="sidebar-brand">
          <div className="brand-symbol">
            <HeartPulse size={36} />
          </div>

          <div>
            <h2>NOVA</h2>
            <span>Hospital Management</span>
          </div>

          <button
            type="button"
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((group) => {
            const visibleItems = group.items.filter((item) =>
              hasPermission(item.permission)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div className="nav-group" key={group.title}>
                <span className="nav-group-title">
                  {group.title}
                </span>

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
                      onClick={() => {
                        setSidebarOpen(false);
                        closeMenus();
                      }}
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

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <main className="main-area">

        {/* TOPBAR */}
        <header className="topbar">
          <button
            type="button"
            className="icon-button mobile-menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={22} />
          </button>

          <div className="topbar-search">
            <Users size={19} />

            <input
              type="search"
              placeholder="Search patients, doctors, or records..."
              aria-label="Search hospital records"
            />
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="icon-button notification-button"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell size={21} />
            </button>

            <button
              type="button"
              className="icon-button"
              title="Appearance"
              aria-label="Appearance"
            >
              <Moon size={21} />
            </button>

            <div
              className="dropdown-wrapper"
              ref={dropdownRef}
            >

              {/* HOSPITAL SELECTOR */}
              <button
                type="button"
                className="hospital-selector"
                onClick={() => {
                  setHospitalOpen((previous) => !previous);
                  setProfileOpen(false);
                }}
                aria-expanded={hospitalOpen}
              >
                <Building2 size={19} />

                <span>
                  {hospital?.name || "Select Hospital"}
                </span>

                <ChevronDown size={16} />
              </button>

              {hospitalOpen && (
                <div className="dropdown-menu hospital-dropdown">
                  <strong>Your Hospitals</strong>

                  {hospitals.length === 0 ? (
                    <p>No hospital memberships found.</p>
                  ) : (
                    hospitals.map((item) => {
                      const isActive =
                        Number(item.id) === Number(hospital?.id);

                      return (
                        <button
                          type="button"
                          key={item.id}
                          disabled={switching || isActive}
                          onClick={() =>
                            handleHospitalChange(item.id)
                          }
                        >
                          <span>{item.name}</span>
                          {isActive && <span>✓</span>}
                        </button>
                      );
                    })
                  )}

                  {switching && (
                    <p>Switching hospital...</p>
                  )}
                </div>
              )}

              {/* USER PROFILE */}
              <div className="profile-wrapper">
                <button
                  type="button"
                  className="profile-button"
                  onClick={() => {
                    setProfileOpen((previous) => !previous);
                    setHospitalOpen(false);
                  }}
                  aria-expanded={profileOpen}
                >
                  <div className="avatar">
                    {(user?.fullName || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="profile-info">
                    <strong>
                      {user?.fullName || "User"}
                    </strong>

                    <span>
                      {user?.isPlatformAdmin
                        ? "Super Admin"
                        : "Hospital User"}
                    </span>
                  </div>

                  <ChevronDown size={16} />
                </button>

                {profileOpen && (
                  <div className="dropdown-menu profile-dropdown">
                    <strong>{user?.email}</strong>

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                    >
                      <LogOut size={16} />

                      {loggingOut
                        ? "Signing out..."
                        : "Sign Out"}
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <section className="page-content">
          <Outlet />
        </section>

      </main>
    </div>
  );
}
