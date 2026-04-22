import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getShop } from '../services/shopService';

const ShopContext = createContext({ shop: null, loading: false, error: null });

export function ShopProvider({ children }) {
  const { user } = useAuth();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch shop data when an employee is logged in
    if (user?.role === 'employee') {
      setLoading(true);
      getShop()
        .then((data) => setShop(data))
        .catch(() => setError('Failed to load store details'))
        .finally(() => setLoading(false));
    } else {
      setShop(null);
      setLoading(false);
    }
  }, [user]);

  return (
    <ShopContext.Provider value={{ shop, loading, error }}>
      {children}
    </ShopContext.Provider>
  );
}

export const useShop = () => useContext(ShopContext);
