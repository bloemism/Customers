import { supabase } from './supabase';
import { supabaseErrorMessage } from './supabaseErrors';

export type IapPurchaseLineSnapshot = {
  symbol: string;
  item_name: string;
  variety_name: string;
  cases: number;
  /** 注文時点のケース単価（顧客は小売） */
  unit_price_yen: number;
  line_subtotal_yen: number;
};

export type IapPurchaseDeliverySnapshot = {
  customer?: {
    customer_id: string;
    full_name: string;
    prefecture: string;
    city: string;
    postal_code: string;
    street_address: string;
    phone: string;
  };
  store?: {
    trade_name: string;
    store_code: string;
    market_name: string;
  };
};

export type InsertIapPurchaseRecordInput = {
  buyerKind: 'customer' | 'store' | 'admin_dev';
  viewerRole: string;
  customerId: string | null;
  storeId: string | null;
  customerName: string;
  prefecture: string;
  city: string;
  postalCode: string;
  streetAddress: string;
  phone: string;
  deliverySnapshot: IapPurchaseDeliverySnapshot;
  linesSnapshot: IapPurchaseLineSnapshot[];
  subtotalYenExTax: number;
  taxYen: number;
  totalYenIncTax: number;
};

export async function insertIapPurchaseRecord(input: InsertIapPurchaseRecordInput): Promise<string> {
  const { data: rows, error } = await supabase
    .from('iap_purchase_records')
    .insert({
      buyer_kind: input.buyerKind,
      viewer_role: input.viewerRole,
      customer_id: input.customerId,
      store_id: input.storeId,
      customer_name: input.customerName,
      prefecture: input.prefecture,
      city: input.city,
      postal_code: input.postalCode,
      street_address: input.streetAddress,
      phone: input.phone,
      status: 'received',
      delivery_snapshot: input.deliverySnapshot,
      lines_snapshot: input.linesSnapshot,
      subtotal_yen_ex_tax: Math.round(input.subtotalYenExTax),
      tax_yen: Math.round(input.taxYen),
      total_yen_inc_tax: Math.round(input.totalYenIncTax),
    })
    .select('id');

  if (error) throw error;
  const row = rows?.[0] as { id?: string } | undefined;
  const id = row?.id;
  if (!id) throw new Error('購入記録の登録に成功しましたが id が返りませんでした');
  return id;
}

export type IapOrderRecord = {
  id: string;
  createdAt: string;
  buyerKind: string;
  customerId: string | null;
  storeId: string | null;
  customerName: string;
  prefecture: string;
  city: string;
  postalCode: string;
  streetAddress: string;
  phone: string;
  assignedStoreId: string | null;
  assignedMarketName: string;
  status: string;
  deliverySnapshot: IapPurchaseDeliverySnapshot;
  lines: IapPurchaseLineSnapshot[];
  subtotalYenExTax: number;
  taxYen: number;
  totalYenIncTax: number;
};

export type IapAssignableStore = {
  id: string;
  storeName: string;
  address: string;
  email: string;
  marketName: string;
};

const ORDER_COLUMNS =
  'id, created_at, buyer_kind, customer_id, store_id, customer_name, prefecture, city, postal_code, street_address, phone, assigned_store_id, assigned_market_name, status, delivery_snapshot, lines_snapshot, subtotal_yen_ex_tax, tax_yen, total_yen_inc_tax';

/** テーブル未作成・列未追加のときは運営ページを空表示にする */
export function isIapOrdersTableMissing(err: unknown): boolean {
  const message = supabaseErrorMessage(err).toLowerCase();
  const code =
    err && typeof err === 'object' && typeof (err as { code?: string }).code === 'string'
      ? (err as { code: string }).code
      : '';
  if (code === '42P01' || code === '42703' || code === 'PGRST204' || code === 'PGRST205') return true;
  return (
    message.includes('iap_purchase_records') &&
    (message.includes('does not exist') ||
      message.includes('schema cache') ||
      message.includes('could not find') ||
      message.includes('column'))
  );
}

function asSnapshot(value: unknown): IapPurchaseDeliverySnapshot {
  if (!value || typeof value !== 'object') return {};
  return value as IapPurchaseDeliverySnapshot;
}

function asLines(value: unknown): IapPurchaseLineSnapshot[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const line = row as Partial<IapPurchaseLineSnapshot>;
    return [
      {
        symbol: String(line.symbol ?? ''),
        item_name: String(line.item_name ?? ''),
        variety_name: String(line.variety_name ?? ''),
        cases: Number(line.cases) || 0,
        unit_price_yen: Number(line.unit_price_yen) || 0,
        line_subtotal_yen: Number(line.line_subtotal_yen) || 0,
      },
    ];
  });
}

function mapOrderRow(row: Record<string, unknown>): IapOrderRecord {
  return {
    id: String(row.id ?? ''),
    createdAt: String(row.created_at ?? ''),
    buyerKind: String(row.buyer_kind ?? ''),
    customerId: row.customer_id ? String(row.customer_id) : null,
    storeId: row.store_id ? String(row.store_id) : null,
    customerName: String(row.customer_name ?? ''),
    prefecture: String(row.prefecture ?? ''),
    city: String(row.city ?? ''),
    postalCode: String(row.postal_code ?? ''),
    streetAddress: String(row.street_address ?? ''),
    phone: String(row.phone ?? ''),
    assignedStoreId: row.assigned_store_id ? String(row.assigned_store_id) : null,
    assignedMarketName: String(row.assigned_market_name ?? ''),
    status: String(row.status ?? 'received'),
    deliverySnapshot: asSnapshot(row.delivery_snapshot),
    lines: asLines(row.lines_snapshot),
    subtotalYenExTax: Number(row.subtotal_yen_ex_tax) || 0,
    taxYen: Number(row.tax_yen) || 0,
    totalYenIncTax: Number(row.total_yen_inc_tax) || 0,
  };
}

export async function fetchIapPurchaseRecords(): Promise<IapOrderRecord[]> {
  const { data, error } = await supabase
    .from('iap_purchase_records')
    .select(ORDER_COLUMNS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapOrderRow(row as unknown as Record<string, unknown>));
}

export async function updateIapOrderAssignment(
  id: string,
  assignedStoreId: string | null,
  assignedMarketName: string
): Promise<void> {
  const { error } = await supabase
    .from('iap_purchase_records')
    .update({
      assigned_store_id: assignedStoreId,
      assigned_market_name: assignedMarketName.trim(),
    })
    .eq('id', id);
  if (error) throw error;
}

function mapAssignableStore(row: Record<string, unknown>): IapAssignableStore {
  return {
    id: String(row.id ?? ''),
    storeName: String(row.store_name || row.name || '無記名の店舗'),
    address: String(row.address ?? ''),
    email: String(row.email ?? '').trim(),
    marketName: String(row.iap_default_delivery_market_name ?? '').trim(),
  };
}

export async function fetchIapAssignableStores(): Promise<IapAssignableStore[]> {
  const withMarket = await supabase
    .from('public_stores')
    .select('id, store_name, name, address, email, iap_default_delivery_market_name')
    .order('store_name', { ascending: true });
  if (!withMarket.error) {
    return (withMarket.data ?? []).map((row) => mapAssignableStore(row as unknown as Record<string, unknown>));
  }
  const basic = await supabase
    .from('public_stores')
    .select('id, store_name, name, address, email')
    .order('store_name', { ascending: true });
  if (basic.error) throw basic.error;
  return (basic.data ?? []).map((row) => mapAssignableStore(row as unknown as Record<string, unknown>));
}
