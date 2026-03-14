-- customer_school_registrations の RLS を修正
-- customer_id は customers.id（UUID）を参照しているが、auth.uid() は customers.user_id と一致する
-- そのため「customer_id = auth.uid()」では顧客が自分の登録を読めない
-- → customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()) に変更

DROP POLICY IF EXISTS "Customers can view own registrations" ON customer_school_registrations;
DROP POLICY IF EXISTS "Customers can insert own registrations" ON customer_school_registrations;
DROP POLICY IF EXISTS "Customers can update own registrations" ON customer_school_registrations;

CREATE POLICY "Customers can view own registrations" ON customer_school_registrations
    FOR SELECT USING (
        customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    );

CREATE POLICY "Customers can insert own registrations" ON customer_school_registrations
    FOR INSERT WITH CHECK (
        customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    );

CREATE POLICY "Customers can update own registrations" ON customer_school_registrations
    FOR UPDATE USING (
        customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    );
