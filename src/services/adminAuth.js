import { getSupabaseClient } from '../lib/supabase';
import { getDefaultAdminRoute, isKnownAdminRole } from '../lib/roles';

const ADMIN_SESSION_KEY = 'restaurant_admin_session';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getAdminSession() {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(ADMIN_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getAdminToken() {
  return getAdminSession()?.token || '';
}

export function isAdminAuthenticated() {
  const session = getAdminSession();
  return Boolean(session?.role && session.email && session.token && isKnownAdminRole(session.role));
}

export function getAdminHomePath() {
  return getDefaultAdminRoute();
}

export function logoutAdmin() {
  if (canUseStorage()) {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

export async function loginAdmin(email, password) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('admin_login', {
    input_email: email.trim().toLowerCase(),
    input_password: password,
  });

  if (error) {
    throw new Error(error.message || 'Connexion impossible.');
  }

  const admin = Array.isArray(data) ? data[0] : data;

  if (!admin?.token || !admin.role) {
    throw new Error('Email ou mot de passe incorrect.');
  }

  const session = {
    token: admin.token,
    email: admin.email,
    role: admin.role,
    logged_at: new Date().toISOString(),
  };

  if (canUseStorage()) {
    window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  }

  return session;
}
