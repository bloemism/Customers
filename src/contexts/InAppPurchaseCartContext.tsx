import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  deleteIapCatalogItem,
  fetchIapCatalogWithStock,
  getIapSupabaseHostMessage,
  insertIapCatalogItem,
  isPersistedIapCatalogId,
  updateIapCatalogItem,
} from '../lib/iapCatalogRepository';
import { withTimeout } from '../lib/asyncTimeout';
import { supabaseErrorMessage } from '../lib/supabaseErrors';
import { createEmptyInAppPurchaseProduct } from '../types/inAppPurchaseProduct';
import type { CatalogViewerRole, InAppPurchaseProduct } from '../types/inAppPurchaseProduct';
import { filterProductsForRole } from '../types/inAppPurchaseProduct';
import { useCustomerAuth } from './CustomerAuthContext';
import { useSimpleAuth } from './SimpleAuthContext';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'iap_dev_cart_v1';
const PERSIST_DEBOUNCE_MS = 650;

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
  productsLoading: boolean;
  productsSaving: boolean;
  productsError: string | null;
  refreshProducts: () => Promise<void>;
  patchProduct: (id: string, partial: Partial<InAppPurchaseProduct>) => void;
  addCatalogRow: () => void;
  registerDraftProduct: (draft: InAppPurchaseProduct) => Promise<void>;
  removeCatalogRow: (id: string) => Promise<void>;
  saveProduct: (product: InAppPurchaseProduct) => Promise<void>;
  viewerRole: CatalogViewerRole;
  setViewerRole: (r: CatalogViewerRole) => void;
  orderCases: Record<string, number>;
  setCases: (id: string, raw: string) => void;
  customerParty: CustomerParty;
  setCustomerParty: React.Dispatch<React.SetStateAction<CustomerParty>>;
  storeParty: StoreParty;
  setStoreParty: React.Dispatch<React.SetStateAction<StoreParty>>;
  /** DB の customers.id（ログイン連携時） */
  linkedCustomerId: string | null;
  /** DB の stores.id 文字列（店舗ログイン連携時） */
  linkedStoreId: string | null;
  /** カート明細のみクリア */
  clearCartLines: () => void;
  filteredProducts: InAppPurchaseProduct[];
};

const IapShopContext = createContext<IapShopContextValue | null>(null);

export function IapShopProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<InAppPurchaseProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsSaving, setProductsSaving] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const persistTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const persisted = typeof window !== 'undefined' ? loadPersisted() : null;
  const [viewerRole, setViewerRoleState] = useState<CatalogViewerRole>(persisted?.viewerRole ?? 'customer');
  const [orderCases, setOrderCases] = useState<Record<string, number>>(persisted?.orderCases ?? {});
  const [customerParty, setCustomerParty] = useState<CustomerParty>(persisted?.customerParty ?? emptyCustomer);
  const [storeParty, setStoreParty] = useState<StoreParty>(persisted?.storeParty ?? emptyStore);

  const { customer, loading: customerAuthLoading } = useCustomerAuth();
  const { user: simpleUser, loading: simpleAuthLoading } = useSimpleAuth();
  const [linkedCustomerId, setLinkedCustomerId] = useState<string | null>(null);
  const [linkedStoreId, setLinkedStoreId] = useState<string | null>(null);
  const lastSyncedCustomerId = useRef<string | null>(null);
  const lastSyncedStoreKey = useRef<string | null>(null);

  useEffect(() => {
    if (customerAuthLoading) return;
    if (!customer?.id) {
      setLinkedCustomerId(null);
      lastSyncedCustomerId.current = null;
      return;
    }
    if (lastSyncedCustomerId.current === customer.id) return;
    lastSyncedCustomerId.current = customer.id;
    setLinkedCustomerId(customer.id);
    setCustomerParty({
      fullName: customer.name || '',
      phone: customer.phone ?? '',
      address: customer.address ?? '',
      customerCode: customer.customer_code ?? '',
    });
  }, [customerAuthLoading, customer]);

  useEffect(() => {
    if (simpleAuthLoading) return;
    if (!simpleUser?.email) {
      setLinkedStoreId(null);
      lastSyncedStoreKey.current = null;
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('id, store_name, iap_wholesaler_code, iap_default_delivery_market_name')
        .eq('email', simpleUser.email)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setLinkedStoreId(null);
        lastSyncedStoreKey.current = null;
        return;
      }
      const sid = String(data.id);
      if (lastSyncedStoreKey.current === sid) return;
      lastSyncedStoreKey.current = sid;
      setLinkedStoreId(sid);
      setStoreParty({
        tradeName: String(data.store_name ?? ''),
        storeCode: String(data.iap_wholesaler_code ?? sid),
        marketName: String(data.iap_default_delivery_market_name ?? ''),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [simpleAuthLoading, simpleUser?.email]);

  const clearCartLines = useCallback(() => {
    setOrderCases({});
  }, []);

  const clearPersistTimer = useCallback((id: string) => {
    const t = persistTimersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      persistTimersRef.current.delete(id);
    }
  }, []);

  useEffect(() => {
    return () => {
      for (const t of persistTimersRef.current.values()) clearTimeout(t);
      persistTimersRef.current.clear();
    };
  }, []);

  const refreshProducts = useCallback(async () => {
    setProductsError(null);
    setProductsLoading(true);
    try {
      const list = await withTimeout(fetchIapCatalogWithStock(), 25_000, 'アプリ内販売カタログの取得');
      setProducts(list);
    } catch (e: unknown) {
      const base = supabaseErrorMessage(e) || 'カタログの読み込みに失敗しました';
      setProductsError(`${base}（${getIapSupabaseHostMessage()}）`);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProducts();
  }, [refreshProducts]);

  const schedulePersist = useCallback(
    (product: InAppPurchaseProduct) => {
      if (!isPersistedIapCatalogId(product.id)) return;
      clearPersistTimer(product.id);
      const t = setTimeout(() => {
        persistTimersRef.current.delete(product.id);
        void (async () => {
          try {
            await updateIapCatalogItem(product);
            setProductsError(null);
          } catch (e: unknown) {
            setProductsError(supabaseErrorMessage(e) || '保存に失敗しました');
          }
        })();
      }, PERSIST_DEBOUNCE_MS);
      persistTimersRef.current.set(product.id, t);
    },
    [clearPersistTimer]
  );

  const patchProduct = useCallback(
    (id: string, partial: Partial<InAppPurchaseProduct>) => {
      let merged: InAppPurchaseProduct | null = null;
      setProducts((prev) => {
        const cur = prev.find((p) => p.id === id);
        if (!cur) return prev;
        merged = { ...cur, ...partial, taxRate: 0.1 };
        return prev.map((p) => (p.id === id ? merged! : p));
      });
      if (merged && isPersistedIapCatalogId(merged.id)) schedulePersist(merged);
    },
    [schedulePersist]
  );

  const saveProduct = useCallback(
    async (product: InAppPurchaseProduct) => {
      clearPersistTimer(product.id);
      if (!isPersistedIapCatalogId(product.id)) return;
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...product, taxRate: 0.1 } : p)));
      try {
        await updateIapCatalogItem({ ...product, taxRate: 0.1 });
        setProductsError(null);
      } catch (e: unknown) {
        setProductsError(supabaseErrorMessage(e) || '保存に失敗しました');
        throw e;
      }
    },
    [clearPersistTimer]
  );

  const addCatalogRow = useCallback(() => {
    setProductsError(null);
    setProducts((prev) => [...prev, createEmptyInAppPurchaseProduct()]);
  }, []);

  const registerDraftProduct = useCallback(async (draft: InAppPurchaseProduct) => {
    if (isPersistedIapCatalogId(draft.id)) return;
    setProductsSaving(true);
    setProductsError(null);
    try {
      const saved = await withTimeout(insertIapCatalogItem(draft), 30_000, '新規登録（INSERT）');
      setProducts((prev) => prev.map((x) => (x.id === draft.id ? saved : x)));
      setOrderCases((prev) => {
        const c = prev[draft.id];
        const next = { ...prev };
        delete next[draft.id];
        if (c != null && c > 0) next[saved.id] = c;
        return next;
      });
    } catch (e: unknown) {
      const base = supabaseErrorMessage(e) || '新規登録に失敗しました';
      setProductsError(`${base}（${getIapSupabaseHostMessage()}）`);
    } finally {
      setProductsSaving(false);
    }
  }, []);

  const removeCatalogRow = useCallback(
    async (id: string) => {
      clearPersistTimer(id);
      if (isPersistedIapCatalogId(id)) {
        try {
          await deleteIapCatalogItem(id);
          setProductsError(null);
        } catch (e: unknown) {
          setProductsError(supabaseErrorMessage(e) || '削除に失敗しました');
          return;
        }
      }
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setOrderCases((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
    [clearPersistTimer]
  );

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
      productsLoading,
      productsSaving,
      productsError,
      refreshProducts,
      patchProduct,
      addCatalogRow,
      registerDraftProduct,
      removeCatalogRow,
      saveProduct,
      viewerRole,
      setViewerRole,
      orderCases,
      setCases,
      customerParty,
      setCustomerParty,
      storeParty,
      setStoreParty,
      linkedCustomerId,
      linkedStoreId,
      clearCartLines,
      filteredProducts,
    }),
    [
      products,
      productsLoading,
      productsSaving,
      productsError,
      refreshProducts,
      patchProduct,
      addCatalogRow,
      registerDraftProduct,
      removeCatalogRow,
      saveProduct,
      viewerRole,
      orderCases,
      customerParty,
      storeParty,
      linkedCustomerId,
      linkedStoreId,
      clearCartLines,
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
