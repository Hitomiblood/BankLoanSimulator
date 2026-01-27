import { createContext, useContext, useState } from "react";
import { setUserContext, clearUserContext, addBreadcrumb } from "../config/sentry";

type AuthContextType = {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const login = (token: string) => {
    localStorage.setItem("token", token);
    setToken(token);

    // Decodificar el token JWT para obtener información del usuario
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Establecer contexto de usuario en Sentry
      setUserContext({
        id: payload.sub || payload.userId || 'unknown',
        email: payload.email,
        username: payload.unique_name,
        role: payload.role || localStorage.getItem("role") || undefined,
      });

      // Breadcrumb de login exitoso
      addBreadcrumb({
        category: 'auth',
        message: 'Usuario inició sesión',
        level: 'info',
        data: {
          userId: payload.sub || payload.userId,
          role: payload.role,
        }
      });
    } catch (error) {
      console.error('Error decodificando token para Sentry:', error);
    }
  };

  const logout = () => {
    // Breadcrumb de logout
    addBreadcrumb({
      category: 'auth',
      message: 'Usuario cerró sesión',
      level: 'info'
    });

    localStorage.removeItem("token");
    setToken(null);

    // Limpiar contexto de usuario en Sentry
    clearUserContext();
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
