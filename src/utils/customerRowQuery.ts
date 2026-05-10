import { supabase } from '../lib/supabase';

/** PostgREST の or= に UUID を渡すと 400 になり得るため、eq を順に試す */
export async function selectCustomerByAuthUserId(userId: string) {
  // 同一 user_id の重複行があると maybeSingle が 406 になるため、常に 1 件に絞る
  const byUser = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  if (byUser.error) return byUser;
  if (byUser.data) return byUser;
  return supabase.from('customers').select('*').eq('id', userId).maybeSingle();
}
