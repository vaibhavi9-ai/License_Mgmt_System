import { useState } from "react";
import { getToken, setToken, removeToken } from "../services/auth";

export default function useAuth() {
  const [token, setTokenState] = useState(getToken());
  const login = t => { setToken(t); setTokenState(t); };
  const logout = () => { removeToken(); setTokenState(null); };
  return { token, login, logout, isAuthenticated: !!token };
}
