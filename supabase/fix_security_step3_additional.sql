-- Step 3: 追加のRLSポリシー作成
-- 基本的なポリシーが成功した後に実行

-- customersテーブルのポリシー（user_idが存在する場合）
CREATE POLICY "顧客は自分のデータのみアクセス可能" ON customers
    FOR ALL USING (auth.uid() = user_id);

-- purchase_historyテーブルのポリシー（customer_idが存在する場合）
CREATE POLICY "顧客は自分の購入履歴のみアクセス可能" ON purchase_history
    FOR ALL USING (auth.uid() = customer_id);

-- purchase_itemsテーブルのポリシー
CREATE POLICY "購入履歴のアイテムは関連する顧客のみアクセス可能" ON purchase_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM purchase_history 
            WHERE purchase_history.id = purchase_items.purchase_id 
            AND purchase_history.customer_id = auth.uid()
        )
    );

-- store_imagesテーブルのポリシー
CREATE POLICY "店舗オーナーは自分の店舗の画像のみアクセス可能" ON store_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = store_images.store_id 
            AND stores.owner_id = auth.uid()
        )
    );

CREATE POLICY "認証されたユーザーは店舗画像を閲覧可能" ON store_images
    FOR SELECT USING (auth.role() = 'authenticated');

-- store_bulletinsテーブルのポリシー
CREATE POLICY "店舗オーナーは自分の店舗の掲示板のみアクセス可能" ON store_bulletins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = store_bulletins.store_id 
            AND stores.owner_id = auth.uid()
        )
    );

CREATE POLICY "認証されたユーザーは店舗掲示板を閲覧可能" ON store_bulletins
    FOR SELECT USING (auth.role() = 'authenticated');
