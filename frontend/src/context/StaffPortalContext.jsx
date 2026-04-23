import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const StaffPortalContext = createContext();

export function useStaffPortal() {
  return useContext(StaffPortalContext);
}

export function StaffPortalProvider({ children }) {
  const [staffUser, setStaffUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('staffToken');
      if (token) {
        try {
          const res = await api.get('/portal/me');
          // Ensure we preserve the mustChangePassword state if it's there
          // Note: /me might not return it, so we default to false if not present
          setStaffUser({ ...res.data.staff, mustChangePassword: res.data.staff.mustChangePassword || false });
        } catch (err) {
          console.error('Staff auth failed', err);
          localStorage.removeItem('staffToken');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/portal/login', { email, password });
    localStorage.setItem('staffToken', res.data.token);
    // Combine staff data with mustChangePassword flag
    setStaffUser({ ...res.data.staff, mustChangePassword: res.data.mustChangePassword });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('staffToken');
    setStaffUser(null);
  };

  const value = {
    staffUser,
    loading,
    login,
    logout,
    setStaffUser
  };

  return (
    <StaffPortalContext.Provider value={value}>
      {!loading && children}
    </StaffPortalContext.Provider>
  );
}
