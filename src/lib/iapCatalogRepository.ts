import { getResolvedSupabaseHost, supabase } from './supabase';
import type { InAppPurchaseProduct, ProductGradeClass } from '../types/inAppPurchaseProduct';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isPersistedIapCatalogId(id: string): boolean {
  return UUID_RE.test(id);
}

type IapCatalogItemRow = {
  id: string;
  symbol: string;
  item_name: string;
  variety_name: string;
  color: string;
  origin: string;
  size_label: string;
  grade_class: ProductGradeClass;
  image_url: string;
  description: string;
  wholesale_price_yen: number;
  b2b_units_per_case: number;
  b2b_case_count: number;
  retail_price_yen: number;
  b2c_units_per_case: number;
  b2c_case_count: number;
  tax_rate: string | number;
  is_published: boolean;
  is_public_b2b: boolean;
  is_public_b2c: boolean;
  sales_starts_at: string;
  sales_ends_at: string;
};

function numTax(v: string | number): number {
  return typeof v === 'number' ? v : Number(v);
}

export function mapRowToProduct(row: IapCatalogItemRow, stockQty: number): InAppPurchaseProduct {
  return {
    id: row.id,
    symbol: row.symbol ?? '',
    itemName: row.item_name ?? '',
    varietyName: row.variety_name ?? '',
    color: row.color ?? '',
    origin: row.origin ?? '',
    sizeLabel: row.size_label ?? '',
    gradeClass: row.grade_class === 'non_standard' ? 'non_standard' : 'standard',
    imageUrl: row.image_url ?? '',
    description: row.description ?? '',
    wholesalePrice: Number(row.wholesale_price_yen) || 0,
    b2bUnitsPerCase: Number(row.b2b_units_per_case) || 0,
    b2bCaseCount: Number(row.b2b_case_count) || 0,
    retailPrice: Number(row.retail_price_yen) || 0,
    b2cUnitsPerCase: Number(row.b2c_units_per_case) || 0,
    b2cCaseCount: Number(row.b2c_case_count) || 0,
    taxRate: numTax(row.tax_rate),
    stockQuantity: Math.max(0, Math.floor(stockQty)),
    isPublished: !!row.is_published,
    isPublicB2b: !!row.is_public_b2b,
    isPublicB2c: !!row.is_public_b2c,
    salesStartAt: row.sales_starts_at,
    salesEndAt: row.sales_ends_at,
  };
}

function productToItemUpdate(p: InAppPurchaseProduct): Record<string, unknown> {
  return {
    symbol: p.symbol,
    item_name: p.itemName,
    variety_name: p.varietyName,
    color: p.color,
    origin: p.origin,
    size_label: p.sizeLabel,
    grade_class: p.gradeClass,
    image_url: p.imageUrl,
    description: p.description,
    wholesale_price_yen: Math.max(0, Math.floor(p.wholesalePrice)),
    b2b_units_per_case: Math.max(0, Math.floor(p.b2bUnitsPerCase)),
    b2b_case_count: Math.max(0, Math.floor(p.b2bCaseCount)),
    retail_price_yen: Math.max(0, Math.floor(p.retailPrice)),
    b2c_units_per_case: Math.max(0, Math.floor(p.b2cUnitsPerCase)),
    b2c_case_count: Math.max(0, Math.floor(p.b2cCaseCount)),
    tax_rate: p.taxRate,
    is_published: p.isPublished,
    is_public_b2b: p.isPublicB2b,
    is_public_b2c: p.isPublicB2c,
    sales_starts_at: p.salesStartAt,
    sales_ends_at: p.salesEndAt,
  };
}

/** エラー表示用（秘密情報は含めない） */
export function getIapSupabaseHostMessage(): string {
  return `API 接続先: ${getResolvedSupabaseHost()}`;
}

type StockEmbed = { quantity_available?: number } | null | undefined;
type ItemRowWithEmbed = IapCatalogItemRow & { iap_catalog_stock?: StockEmbed | StockEmbed[] };

function embeddedStockQty(st: StockEmbed | StockEmbed[] | null | undefined): number {
  if (st == null) return 0;
  if (Array.isArray(st)) {
    const first = st[0];
    return first ? Math.max(0, Math.floor(Number(first.quantity_available) || 0)) : 0;
  }
  return Math.max(0, Math.floor(Number(st.quantity_available) || 0));
}

async function fetchIapCatalogWithStockLegacy(): Promise<InAppPurchaseProduct[]> {
  const { data: items, error: itemsError } = await supabase
    .from('iap_catalog_items')
    .select('*')
    .order('created_at', { ascending: true });

  if (itemsError) throw itemsError;

  const rows = (items ?? []) as IapCatalogItemRow[];
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const { data: stocks, error: stockError } = await supabase
    .from('iap_catalog_stock')
    .select('catalog_item_id, quantity_available')
    .in('catalog_item_id', ids);

  if (stockError) throw stockError;

  const qtyById = new Map<string, number>();
  for (const s of stocks ?? []) {
    qtyById.set(s.catalog_item_id as string, Number(s.quantity_available) || 0);
  }

  return rows.map((row) => mapRowToProduct(row, qtyById.get(row.id) ?? 0));
}

export async function fetchIapCatalogWithStock(): Promise<InAppPurchaseProduct[]> {
  const { data, error } = await supabase
    .from('iap_catalog_items')
    .select(
      `
      *,
      iap_catalog_stock ( quantity_available )
    `
    )
    .order('created_at', { ascending: true });

  if (error) {
    const msg = error.message ?? '';
    const code = (error as { code?: string }).code ?? '';
    const useLegacy =
      code === 'PGRST200' ||
      msg.includes('Could not find') ||
      msg.includes('schema cache') ||
      msg.includes('relationship');

    if (useLegacy) {
      return fetchIapCatalogWithStockLegacy();
    }
    throw error;
  }

  const rawList = (data ?? []) as ItemRowWithEmbed[];
  return rawList.map((raw) => {
    const { iap_catalog_stock: st, ...itemRow } = raw;
    return mapRowToProduct(itemRow as IapCatalogItemRow, embeddedStockQty(st));
  });
}

export async function insertIapCatalogItem(p: InAppPurchaseProduct): Promise<InAppPurchaseProduct> {
  // seller_store_id は DB デフォルト NULL に任せる（null 明示が PostgREST で問題になるケースを避ける）
  const insertPayload = {
    ...productToItemUpdate(p),
  };

  const { data: insertedList, error: insErr } = await supabase
    .from('iap_catalog_items')
    .insert(insertPayload)
    .select('*');

  if (insErr) throw insErr;

  const row = (insertedList?.[0] ?? null) as IapCatalogItemRow | null;
  if (!row?.id) {
    throw new Error(
      'INSERT 後に行データが返りませんでした。Supabase の RLS で SELECT が拒否されていないか、マイグレーション（iap_catalog_rls_dev_open）適用を確認してください。'
    );
  }
  const stockQty = Math.max(0, Math.floor(p.stockQuantity));

  const { error: stErr } = await supabase.from('iap_catalog_stock').insert({
    catalog_item_id: row.id,
    quantity_available: stockQty,
  });

  if (stErr) throw stErr;

  return mapRowToProduct(row, stockQty);
}

export async function updateIapCatalogItem(p: InAppPurchaseProduct): Promise<void> {
  if (!isPersistedIapCatalogId(p.id)) return;

  const { error: u1 } = await supabase
    .from('iap_catalog_items')
    .update(productToItemUpdate(p))
    .eq('id', p.id);

  if (u1) throw u1;

  const { error: u2 } = await supabase.from('iap_catalog_stock').upsert(
    {
      catalog_item_id: p.id,
      quantity_available: Math.max(0, Math.floor(p.stockQuantity)),
    },
    { onConflict: 'catalog_item_id' }
  );

  if (u2) throw u2;
}

export async function deleteIapCatalogItem(id: string): Promise<void> {
  if (!isPersistedIapCatalogId(id)) return;

  const { error } = await supabase.from('iap_catalog_items').delete().eq('id', id);
  if (error) throw error;
}
