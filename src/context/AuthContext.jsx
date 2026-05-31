import { createContext, useContext, useState } from "react";
import usersData from "../data/users.json";

const AuthContext = createContext(null);

const STORAGE_KEY = "bms_user";

function loadStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser);

  function login(username, password) {
    const found = usersData.find(
      (u) => u.username === username && u.password === password
    );
    if (!found) return false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
    setUser(found);
    return true;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export { AuthContext };
