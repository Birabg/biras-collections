import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { addressesApi } from '../api/addresses';
import { useAuth } from '../auth/AuthContext';

const AddressesContext = createContext(null);

export function AddressesProvider({ children }) {
  const [addresses, setAddressesState] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated, status: authStatus } = useAuth();

  // Load addresses when authenticated
  useEffect(() => {
    let cancelled = false;

    const loadAddresses = async () => {
      if (!isAuthenticated) {
        setAddressesState([]);
        setIsLoaded(true);
        return;
      }

      try {
        const data = await addressesApi.list();
        if (!cancelled) {
          setAddressesState(data ?? []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load addresses:', err);
          setError(err.message);
          setAddressesState([]);
        }
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    };

    loadAddresses();

    return () => { cancelled = true; };
  }, [isAuthenticated, authStatus]);

  const addAddress = useCallback(
    async (address) => {
      try {
        const data = await addressesApi.create(address);
        setAddressesState((prev) => [...prev, data]);
        setError(null);
        return data;
      } catch (err) {
        console.error('Failed to add address:', err);
        setError(err.message);
        throw err;
      }
    },
    [],
  );

  const updateAddress = useCallback(
    async (id, address) => {
      try {
        const data = await addressesApi.update(id, address);
        setAddressesState((prev) => prev.map((a) => (a.id === id ? data : a)));
        setError(null);
        return data;
      } catch (err) {
        console.error('Failed to update address:', err);
        setError(err.message);
        throw err;
      }
    },
    [],
  );

  const removeAddress = useCallback(
    async (id) => {
      const previousAddresses = addresses;
      setAddressesState((prev) => prev.filter((a) => a.id !== id));

      try {
        await addressesApi.remove(id);
        setError(null);
      } catch (err) {
        console.error('Failed to remove address:', err);
        setError(err.message);
        setAddressesState(previousAddresses);
        throw err;
      }
    },
    [addresses],
  );

  const setDefault = useCallback(
    async (id) => {
      try {
        const data = await addressesApi.setDefault(id);
        setAddressesState((prev) =>
          prev.map((a) => (a.id === id ? { ...a, isDefault: true } : { ...a, isDefault: false })),
        );
        setError(null);
        return data;
      } catch (err) {
        console.error('Failed to set default address:', err);
        setError(err.message);
        throw err;
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      addresses,
      isLoaded,
      error,
      addAddress,
      updateAddress,
      removeAddress,
      setDefault,
    }),
    [addresses, isLoaded, error, addAddress, updateAddress, removeAddress, setDefault],
  );

  return <AddressesContext.Provider value={value}>{children}</AddressesContext.Provider>;
}

export function useAddresses() {
  const context = useContext(AddressesContext);
  if (!context) {
    throw new Error('useAddresses must be used within an AddressesProvider');
  }
  return context;
}