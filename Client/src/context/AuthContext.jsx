
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

  async function loadSession() {
    try {
      const result = await api.get("/api/auth/me");

      setUser(result.user);
      setHospital(result.hospital);

      const hospitalResult = await api.get("/api/hospitals/mine");
      setHospitals(hospitalResult.hospitals || []);
    } catch {
      setUser(null);
      setHospital(null);
      setHospitals([]);
    }
  }

  useEffect(() => {
    loadSession().finally(() => setLoading(false));
  }, []);

  async function login(email, password, hospitalId) {
    const result = await api.post("/api/auth/login", {
      email,
      password,
      ...(hospitalId ? { hospitalId: Number(hospitalId) } : {}),
    });

    setUser(result.user);
    setHospital(result.hospital);

    const hospitalResult = await api.get("/api/hospitals/mine");
    setHospitals(hospitalResult.hospitals || []);

    return result;
  }

  async function logout() {
    try {
      await api.post("/api/auth/logout", {});
    } finally {
      setUser(null);
      setHospital(null);
      setHospitals([]);
    }
  }

  async function switchHospital(hospitalId) {
    const result = await api.post("/api/hospitals/switch", {
      hospitalId: Number(hospitalId),
    });

    setHospital(result.hospital);
    await loadSession();

    return result;
  }

  function hasPermission(permission) {
    if (user?.isPlatformAdmin) return true;

    return user?.permissions?.includes(permission) || false;
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
