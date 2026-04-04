# データ復元の参照（ポイント履歴・レッスンスケジュール・決済履歴）

## AI Opus 4.5 で行った修正が消えた場合

**状況:** Opus 4.5 のチャットは**別セッション**のため、このリポジトリや agent-transcripts からは参照できません。制限で止まった時点で、そのチャット内の編集内容は Cursor の別履歴にのみ残っている可能性があります。

**できること:**
- Cursor の **チャット履歴**（サイドバーや Composer の履歴）で、該当の Opus 4.5 の会話が残っていれば、そこからコードをコピーして復元できます。
- 当方で **3ページの挙動を揃える修正** を入れました（下記「復元した修正」）。

**復元した修正（3ページ + スケジュール管理）:**
- **CustomerLessonSchedulePage**（顧客向けレッスンスケジュール）… 認証完了後、顧客がいない場合もローディングを終了し、空のスケジュールを表示（既に適用済み）。
- **PointHistoryPage**（ポイント履歴）… `CustomerContext` の `loading`（`contextLoading`）を参照。認証・顧客取得が終わるまで「読み込み中」、終了後に履歴 or 空リストを表示。
- **PaymentHistoryPage**（決済履歴）… 上記と同様に `contextLoading` を参照し、同じパターンで表示。
- **LessonScheduleManagement**（店舗向けレッスンスケジュール管理）… `SimpleAuthContext` の `loading`（`authLoading`）を参照。認証完了まで「読み込み中」、未ログイン時もローディングを終了して空状態を表示。

**型定義の整備:**
- `CustomerPayment` に `points_earned`、`customer_id` を追加（DB の `customer_payments` と整合）。
- `PointHistory` に `customer_id` を追加（DB の `point_history` と整合）。

これにより、顧客未登録・未ログイン・データなしでも「読み込み中」のまま止まらず、空の一覧や「まだ履歴がありません」が表示されます。

---

リポジトリ内に「opus」という名前の参照はありませんでした。以下のファイルに、**ポイント履歴・レッスンスケジュール・決済履歴**に関連するサンプル／修正用データが含まれています。

---

## 1. ポイント履歴（Point history）

| ファイル | テーブル | 内容 | 注意 |
|----------|----------|------|------|
| `supabase/sample_customer_data.sql` | `point_transactions` | 顧客別の獲得・使用履歴（earn/use） | 現在のアプリは `customer_id`, `transaction_type`, `points`, `amount`, `description`, `transaction_date` を使用。このファイルは `purchase_id` あり・`transaction_date` なしの形式 |
| `supabase/point_system_setup.sql` | `customer_points`, `point_transactions` | ポイントマスタと取引サンプル | 古いスキーマの可能性 |
| `supabase/fix_customer_technical_levels.sql` | `customer_point_history` | レッスン関連のポイント履歴 | レッスンスクール用（技術レベル・ポイント履歴） |
| `supabase/create_technical_levels_tables.sql` | `customer_point_history` | 同上 | 同上 |

**アプリで参照しているテーブル:** `point_transactions`（`customer_id`, `transaction_type`, `points`, `amount`, `description`, `transaction_date`）

---

## 2. レッスンスケジュール（Lesson schedules）

| ファイル | テーブル | 内容 | 注意 |
|----------|----------|------|------|
| `supabase/add_new_lesson_data.sql` | `lesson_schools` | レッスンスクール 6 件（新宿・銀座・渋谷・横浜・名古屋・大阪） | カラムは `name`, `description`, `address` 等。`lesson_schools` 用。`new_lesson_schedules` ではない |
| `supabase/restore_lesson_data.sql` | `lesson_schools` | スクール 5 件（東京・京都・大阪・横浜・名古屋） | 同上。`ON CONFLICT (name) DO NOTHING` あり |
| `supabase/restore_original_lesson_data.sql` | `lesson_schools` | 復元用テンプレ（INSERT はコメントアウト） | 実際のデータは未記入 |
| `supabase/delete_sample_data_and_fix_insert.sql` | `lesson_schools` | 1 件（`store_email`: botanism2011@gmail.com） | `store_email`, `name`, `prefecture` 等。RLS の説明付き |
| `supabase/create_customer_participations_table.sql` | `customer_participations` | 参加サンプル 2 件 | `new_lesson_schedules` に `title = 'フラワーアレンジメント基礎講座'` がある前提 |
| `supabase/customer_lesson_participation_action.sql` | RPC + 連携テーブル | **本番で実行推奨** — `customer_lesson_participation_action` が参加/取り消しを `customer_participations`・`customer_notifications`・`customer_lesson_points` を同一トランザクションで更新 | 事前に `customer_notifications_lesson_columns.sql` と `calculate_customer_level` があること |
| `supabase/popularity_rankings_monthly_views.sql` | ビュー + `customer_rankings` 拡張 | 同上 + `product_popularity_by_name_month_view`（`items.name` 原文×月）。`refresh_customer_rankings` は PR + CP の `points_used` を合算 | 先に `customer_payments.payment_data` カラム追加あり。`public_ranking_setup.sql` は本ファイル実行後に再適用（`product_popularity_by_name_ranking_view` = 直近30日） |
| `supabase/perfect_sync_lesson_schools.sql` | `lesson_schools` | 同期・INSERT の例 | バックアップ同期の文脈 |

**アプリで参照しているテーブル:** `new_lesson_schedules`（スケジュール本体）。  
上記の多くは **`lesson_schools`**（スクールマスタ）用で、`new_lesson_schedules` 用の INSERT は少なめです。

---

## 3. 決済履歴（Payment history）

| ファイル | テーブル | 内容 | 注意 |
|----------|----------|------|------|
| `supabase/sample_customer_data.sql` | `purchase_history`, `purchase_items` | 顧客 10 件＋購入履歴＋品目 | 決済履歴として使える。`customers` のカラムが現在のスキーマと異なる（`gender`, `total_purchase_amount` 等） |
| `supabase/payment_system_setup.sql` | `transactions`, `payment_notifications` | トランザクション・通知のサンプル | テーブル名が `payment_transactions` でない可能性 |
| `supabase/stripe_connect_setup.sql` | `store_revenue_summary` | 店舗別売上サマリー（トリガー内の INSERT） | 決済結果の集計用 |
| Stripe 決済完了フロー | `purchase_history`, `payment_transactions` | アプリが保存している形式 | `StripeConnectPaymentComplete.tsx` で挿入 |

**アプリで参照しているテーブル:**  
- **購入履歴:** `purchase_history`（`customer_id`, `store_id`, `total_amount`, `tax_amount`, `points_earned`, `points_used`, `payment_method` 等）＋ `purchase_items`  
- **Stripe Connect 決済:** `payment_transactions`（`store_id`, `customer_id`, `amount`, `stripe_payment_intent_id` 等）

---

## 復元時の注意

1. **スキーマの違い**  
   各 SQL は作成時期・対象プロジェクトが異なります。実行前に Supabase の「Table Editor」や `information_schema` で、対象テーブルのカラムを確認してください。

2. **依存関係**  
   - ポイント履歴・決済履歴は `customers` の `id` に依存します。  
   - レッスン参加は `new_lesson_schedules` と `lesson_schools` の存在に依存します。  
   先にマスタデータ（顧客・スクール・スケジュール）を投入してから、履歴系を流す必要があります。

3. **sample_customer_data.sql を使う場合**  
   - 現在の `customers` は `user_id`, `email`, `name`, `alphabet`, `phone`, `address`, `birth_date`, `points`, `level`, `customer_code` 等です。  
   - `sample_customer_data.sql` の `customers` は `gender`, `total_purchase_amount`, `first_purchase_date`, `last_purchase_date` 等で、そのままでは一致しません。  
   - **購入履歴・品目・ポイント取引だけ**を流すか、INSERT を現在の `customers` のカラムに合わせて書き換える必要があります。

4. **レッスンスケジュール**  
   - `new_lesson_schedules` に挿入するスクリプトは、上記一覧には少ないです。  
   - 既存の `lesson_schools` 用 SQL でスクールを復元したうえで、`new_lesson_schedules` 用の INSERT を別途用意するか、管理画面から登録する形が現実的です。

---

## 次のステップの提案

- **「opus」のデータ**が別環境・別ブランチやバックアップにある場合は、その SQL やエクスポートを共有してもらえれば、現在のスキーマに合わせた復元用 SQL に整えることができます。
- 上記のいずれかのファイルをベースに、**現在のテーブル定義に合わせた復元用 SQL を 1 本にまとめる**ことも可能です。必要なテーブル（例: ポイント履歴だけ／決済履歴だけ／レッスンだけ）を指定してもらえれば、それに合わせてスクリプト案を出します。
