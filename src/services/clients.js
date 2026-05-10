import { callAdminRpc } from './adminRpc';

function normalizeError(error, fallbackMessage) {
  if (error instanceof Error) {
    return error;
  }

  return new Error(error?.message || fallbackMessage);
}

export async function listClients() {
  try {
    const data = await callAdminRpc('admin_list_clients');
    return data || [];
  } catch (error) {
    throw normalizeError(error, 'Impossible de charger les clients.');
  }
}

function dispatchOrdersUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('orders-updated'));
  }
}

export async function listClientAccounts() {
  try {
    const data = await callAdminRpc('admin_list_client_accounts');
    return (data || []).map((client) => ({
      ...client,
      orders_count: Number(client.orders_count || 0),
      total_commandes: Number(client.total_commandes || 0),
      total_paye: Number(client.total_paye || 0),
      dette_totale: Number(client.dette_totale || 0),
      total_remboursements: Number(client.total_remboursements || 0),
    }));
  } catch (error) {
    throw normalizeError(error, 'Impossible de charger les comptes clients.');
  }
}

export async function listClientPayments(clientId) {
  try {
    const data = await callAdminRpc('admin_list_client_payments', {
      input_client_id: clientId,
    });

    return (data || []).map((payment) => ({
      ...payment,
      amount: Number(payment.amount || 0),
    }));
  } catch (error) {
    throw normalizeError(error, 'Impossible de charger les paiements du client.');
  }
}

export async function recordClientPayment({ clientId, amount, notes }) {
  try {
    const data = await callAdminRpc('admin_record_client_payment', {
      input_client_id: clientId,
      input_amount: Number(amount || 0),
      input_notes: notes?.trim() || '',
    });

    dispatchOrdersUpdated();
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    throw normalizeError(error, 'Impossible de valider le paiement.');
  }
}

export async function createClient(clientInput) {
  try {
    const data = await callAdminRpc('admin_create_client', {
      input_name: clientInput.name.trim(),
      input_phone: clientInput.phone?.trim() || '',
      input_workplace: clientInput.workplace?.trim() || '',
      input_notes: clientInput.notes?.trim() || '',
    });

    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    throw normalizeError(error, 'Impossible de créer le client.');
  }
}
