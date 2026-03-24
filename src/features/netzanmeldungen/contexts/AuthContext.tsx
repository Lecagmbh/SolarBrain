/**
 * Auth Context Hook
 * This is a local export that should be replaced with the actual AuthContext from the parent project
 */

import { createContext, useContext } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    // Return a default context for standalone usage
    return {
      user: null,
      isAuthenticated: false,
      login: async () => {},
      logout: () => {},
    };
  }
  return context;
}

export { AuthContext };
export type { User, AuthContextType };
