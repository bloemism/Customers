import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { mockInAppPurchaseProducts } from '../data/mockInAppPurchaseProducts';
import type { CatalogViewerRole, InAppPurchaseProduct } from '../types/inAppPurchaseProduct';
import { filterProductsForRole } from '../types/inAppPurchaseProduct';

const STORAGE_KEY = 'iap_dev_cart_v1';

type PersistedCart = {
  orderCases: Record<string, number>;
  customerParty: CustomerParty;
  storeParty: StoreParty;
  viewerRole: CatalogViewerRole;
};

export type CustomerParty = {
  fullName: string;
  phone: string;
  address: string;
  customerCode: string;
};

export type StoreParty = {
  tradeName: string;
  storeCode: string;
  marketName: string;
};

const emptyCustomer: CustomerParty = {
  fullName: '',
  phone: '',
  address: '',
  customerCode: '',
};

const emptyStore: StoreParty = {
  tradeName: '',
  storeCode: '',
  marketName: '',
};

function loadPersisted(): Partial<PersistedCart> | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedCart;
  } catch {
    return null;
  }
}

function savePersisted(data: PersistedCart) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

type IapShopContextValue = {
  products: InAppPurchaseProduct[];
  setProducts: React.Dispatch<React.SetStateAction<InAppPurchaseProduct[]>>;
  viewerRole: CatalogViewerRole;
  setViewerRole: (r: CatalogViewerRole) => void;
  orderCases: Record<string, number>;
  setCases: (id: string, raw: string) => void;
  customerParty: CustomerParty;
  setCustomerParty: React.Dispatch<React.SetStateAction<CustomerParty>>;
  storeParty: StoreParty;
  setStoreParty: React.Dispatch<React.SetStateAction<StoreParty>>;
  filteredProducts: InAppPurchaseProduct[];
};

const IapShopContext = createContext<IapShopContextValue | null>(null);

export function IapShopProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<InAppPurchaseProduct[]>(() => [...mockInAppPurchaseProducts]);
  const persisted = typeof window !== 'undefined' ? loadPersisted() : null;
  const [viewerRole, setViewerRoleState] = useState<CatalogViewerRole>(persisted?.viewerRole ?? 'customer');
  const [orderCases, setOrderCases] = useState<Record<string, number>>(persisted?.orderCases ?? {});
  const [customerParty, setCustomerParty] = useState<CustomerParty>(persisted?.customerParty ?? emptyCustomer);
  const [storeParty, setStoreParty] = useState<StoreParty>(persisted?.storeParty ?? emptyStore);

  const setViewerRole = useCallback((r: CatalogViewerRole) => {
    setViewerRoleState(r);
  }, []);

  const setCases = useCallback((id: string, raw: string) => {
    const n = Math.max(0, Math.floor(Number(raw) || 0));
    setOrderCases((prev) => ({ ...prev, [id]: n }));
  }, []);

  useEffect(() => {
    savePersisted({
      orderCases,
      customerParty,
      storeParty,
      viewerRole,
    });
  }, [orderCases, customerParty, storeParty, viewerRole]);

  const filteredProducts = useMemo(
    () => filterProductsForRole(viewerRole, products),
    [viewerRole, products]
  );

  const value = useMemo(
    () => ({
      products,
      setProducts,
      viewerRole,
      setViewerRole,
      orderCases,
      setCases,
      customerParty,
      setCustomerParty,
      storeParty,
      setStoreParty,
      filteredProducts,
    }),
    [
      products,
      viewerRole,
      orderCases,
      customerParty,
      storeParty,
      filteredProducts,
      setViewerRole,
      setCases,
    ]
  );

  return <IapShopContext.Provider value={value}>{children}</IapShopContext.Provider>;
}

export function useIapShop(): IapShopContextValue {
  const ctx = useContext(IapShopContext);
  if (!ctx) {
    throw new Error('useIapShop must be used within IapShopProvider');
  }
  return ctx;
}

export { emptyCustomer, emptyStore };
