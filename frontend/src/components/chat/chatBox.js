//src/components/chat/chatBox.js
import React, { createContext, useState, useEffect } from "react";
import axios from "../../api/axiosConfig";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(0);

  useEffect(() => {
    if (authToken) {
      axios
        .get("/api/users/me")
        .then((res) => setUser(res.data))
        .catch(() => {
          setAuthToken(null);
          setUser(null);
          localStorage.removeItem("token");
        });
      axios.get("/api/tokens/balance")
        .then(res => setTokenBalance(res.data.balance));
    }
  }, [authToken]);

  const login = async (email, password) => {
    const res = await axios.post("/api/auth/login", { email, password });
    localStorage.setItem("token", res.data.access_token);
    setAuthToken(res.data.access_token);
  };

  const signup = async (email, password, role) => {
    const res = await axios.post("/api/auth/signup", {
      email,
      password,
      role,
    });
    localStorage.setItem("token", res.data.access_token);
    setAuthToken(res.data.access_token);
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
      }
      return config;
    });
    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [authToken]);

  return (
    <AuthContext.Provider value={{ user, authToken, tokenBalance, setTokenBalance, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
