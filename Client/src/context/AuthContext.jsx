
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  // LOAD AVAILABLE HOSPITALS
  async function loadHospitals() {
    try {
      const result = await api.get("/api/hospitals/mine");
      setHospitals(result.hospitals || []);
    } catch (error) {
      console.error("Hospital loading failed:", error);
      setHospitals([]);
    }
  }

  // RESTORE USER SESSION
  async function loadSession() {
    try {
      const result = await api.get("/api/auth/me");

      setUser(result.user || null);
      setHospital(result.hospital || null);

      if (result.user) {
        await loadHospitals();
      } else {
        setHospitals([]);
      }

      return result;
    } catch (error) {
      setUser(null);
      setHospital(null);
      setHospitals([]);

      return null;
    }
  }

  // INITIAL SESSION CHECK
  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        await loadSession();
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  // LOGIN
  async function login(email, password, hospitalId) {
    const result = await api.post("/api/auth/login", {
      email,
      password,
      ...(hospitalId
        ? { hospitalId: Number(hospitalId) }
        : {}),
    });

    setUser(result.user || null);
    setHospital(result.hospital || null);

    await loadHospitals();

    return result;
  }

  // LOGOUT
  async function logout() {
    try {
      await api.post("/api/auth/logout", {});
    } finally {
      setUser(null);
      setHospital(null);
      setHospitals([]);
    }
  }

  // SWITCH ACTIVE HOSPITAL
  async function switchHospital(hospitalId) {
    const result = await api.post(
      "/api/hospitals/switch",
      {
        hospitalId: Number(hospitalId),
      }
    );

    if (result.hospital) {
      setHospital(result.hospital);
    }

    await loadSession();

    return result;
  }

  // RBAC PERMISSION CHECK
  function hasPermission(permission) {
    if (user?.isPlatformAdmin) {
      return true;
    }

    return (
      user?.permissions?.includes(permission) || false
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        hospital,
        hospitals,
        loading,
        login,
        logout,
        switchHospital,
        hasPermission,
        loadSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// CUSTOM AUTH HOOK
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
