import { getSupabaseClient } from '../lib/supabase';
import { getAdminToken, logoutAdmin } from './adminAuth';

export async function callAdminRpc(functionName, params = {}) {
  const token = getAdminToken();

  if (!token) {
    throw new Error('Connexion admin requise.');
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc(functionName, {
    input_token: token,
    ...params,
  });

  if (error) {
    if (/session admin|jwt|token|permission|invalid|acces refuse|accès refusé/i.test(error.message || '')) {
      logoutAdmin();
    }

    throw new Error(error.message || 'Erreur admin Supabase.');
  }

  return data;
}
