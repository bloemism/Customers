import { supabase } from './supabase';

export type IapPurchaseLineSnapshot = {
  symbol: string;
  item_name: string;
  variety_name: string;
  cases: number;
};

export type IapPurchaseDeliverySnapshot = {
  customer?: {
    full_name: string;
    phone: string;
    address: string;
    customer_code: string;
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
