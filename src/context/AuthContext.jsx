import { createContext, useContext, useState, useEffect } from 'react';
import { subscribeAuth, getAdminData } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const unsub = subscribeAuth(async fbUser => {
      setUser(fbUser);
      if (fbUser) {
        const data = await getAdminData(fbUser.uid);
        setAdminData(data);
      } else {
        setAdminData(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ user, adminData, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
