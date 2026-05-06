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
