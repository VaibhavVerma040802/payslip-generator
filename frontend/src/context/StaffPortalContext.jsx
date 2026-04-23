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
        // Use a generic interceptor logic or specifically set headers for staff requests
        try {
          const res = await api.get('/portal/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setStaffUser(res.data.staff);
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
    setStaffUser(res.data.staff);
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
