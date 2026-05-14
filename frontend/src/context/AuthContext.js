import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";

import { authService } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  const initialized = useRef(false);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken =
        localStorage.getItem("token");

      const storedUser = (() => {
        try {
          return JSON.parse(
            localStorage.getItem("user")
          );
        } catch {
          return null;
        }
      })();

      // No token
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        console.log(
          "Verifying stored token..."
        );

        const userData =
          await authService.verifyToken();

        console.log(
          "Token verified successfully:",
          userData
        );

        setUser(userData);
        setToken(storedToken);

        localStorage.setItem(
          "user",
          JSON.stringify(userData)
        );

      } catch (error) {
        console.warn(
          "Token verification failed:",
          error?.response?.status
        );

        if (
          error?.response?.status === 401
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          setToken(null);
          setUser(null);

        } else if (storedUser) {
          setUser(storedUser);
          setToken(storedToken);
        }
      }

      setLoading(false);
    };

    if (initialized.current) return;

    initialized.current = true;

    initAuth();
  }, []);

  // ================= LOGIN =================

  const login = async (email, password) => {
    try {
      console.log("LOGIN PAYLOAD:", {
        email,
        password,
      });

      const response =
        await authService.login({
          email,
          password,
        });

      console.log(
        "Login response:",
        response
      );

      const newToken =
        response.access_token ||
        response.token;

      const userData = response.user;

      if (newToken) {
        localStorage.setItem(
          "token",
          newToken
        );

        setToken(newToken);
      }

      if (userData) {
        setUser(userData);

        localStorage.setItem(
          "user",
          JSON.stringify(userData)
        );
      }

      return {
        success: true,
        user: userData,
      };

    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      return {
        success: false,
        error:
          error.response?.data?.detail ||
          error.response?.data?.message ||
          "Login failed",
      };
    }
  };

  // ================= REGISTER =================

  const register = async (userData) => {
    try {
      const registrationData = {
        fullName: userData.fullName,
        email: userData.email,
        password: userData.password,
        role: userData.role,
      };

      console.log(
        "Sending registration data:",
        {
          ...registrationData,
          password: "[HIDDEN]",
        }
      );

      const response =
        await authService.register(
          registrationData
        );

      return {
        success: true,
        message: response.message,
      };

    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      return {
        success: false,
        error:
          error.response?.data?.detail ||
          error.response?.data?.message ||
          "Registration failed",
      };
    }
  };

  // ================= LOGOUT =================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
  };

  // ================= HELPERS =================

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const hasRole = (role) => {
    return user && user.role === role;
  };

  const canAccess = (requiredRoles) => {
    if (!user) return false;

    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(
        user.role
      );
    }

    return user.role === requiredRoles;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    hasRole,
    canAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};