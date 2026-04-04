# point_history が今年分ない場合

## 原因（修正済み）

アプリ経由で `customer_payments` だけ INSERT しており、**`point_history` に行を足していなかった**経路がありました（現金: `PaymentPage` / `CashPaymentPage`、Stripe Connect 完了: `StripeConnectPaymentComplete`）。

**現在の方針**: 上記はすべて **`customer_payments`（`status = 'completed'`）への記録のみ**。`point_history` と顧客残高は **`apply_customer_payment_ledger` トリガー**（`supabase/customer_payment_ledger_trigger.sql`）が担当します。`api/stripe-webhook.js` も **`customer_payments` INSERT のみ**です。

詳細は [PAYMENT_LEDGER_PIPELINE.md](./PAYMENT_LEDGER_PIPELINE.md) を参照してください。

## 過去データの埋め戻し（任意・SQL Editor）

**二重登録に注意**: すでに同じ決済で `point_history` に行がある場合は増やさない運用が必要です。`customer_payments.id` を `reason` に含めるなどして一意にするか、対象期間を「`point_history` が空の月」に限定してください。

例（概念のみ・実行前に必ずバックアップ）:

```sql
-- customer_payments から付与・利用を point_history に複製するイメージ
-- 実環境の point_history の列名（points / points_change 等）に合わせて調整すること
INSERT INTO point_history (user_id, customer_id, points, reason, type, created_at)
SELECT
  cp.user_id,
  cp.customer_id::uuid,
  cp.points_earned,
  '決済完了（付与・遡及） - customer_payment ' || cp.id::text,
  'earned',
  cp.created_at
FROM customer_payments cp
WHERE cp.status = 'completed'
  AND cp.points_earned > 0
  AND cp.created_at >= '2026-01-01'
  AND NOT EXISTS (
    SELECT 1 FROM point_history ph
    WHERE ph.user_id = cp.user_id
      AND ph.reason LIKE '%customer_payment ' || cp.id::text || '%'
  );
-- 利用分も同様に points_used > 0 で type 'used'、points を負数で
```

RLS 下ではクライアントからは実行できないため、**Supabase SQL Editor（権限に応じたロール）**で実行します。
