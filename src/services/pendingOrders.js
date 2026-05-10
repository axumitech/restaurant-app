import { getSupabaseClient } from '../lib/supabase';
import { listProductsByIds } from './products';
import { callAdminRpc } from './adminRpc';
import { toast } from 'sonner';

function normalizeError(error, fallbackMessage) {
  if (error instanceof Error) {
    return error;
  }

  return new Error(error?.message || fallbackMessage);
}

function handleSupabaseError(error) {
  console.error(error);
  toast.error('Erreur serveur');
}

function dispatchPendingOrdersUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('pending-orders-updated'));
  }
}

export function normalizePendingItems(items) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    product_id: item.product_id || item.produit_id,
    quantity: Number(item.quantity ?? item.quantite ?? 1),
  })).filter((item) => item.product_id && item.quantity > 0);
}

export async function createPendingOrder(cartItems) {
  try {
    const items = normalizePendingItems(cartItems);

    if (items.length === 0) {
      throw new Error('Votre panier est vide.');
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('pending_orders')
      .insert({ items });

    if (error) {
      handleSupabaseError(error);
      throw error;
    }

    dispatchPendingOrdersUpdated();
    return { items };
  } catch (error) {
    throw normalizeError(error, "Impossible d'envoyer le panier à l'admin.");
  }
}

export async function listPendingOrders() {
  try {
    const data = await callAdminRpc('admin_list_pending_orders');

    const pendingOrders = data || [];
    const productIds = pendingOrders.flatMap((order) =>
      normalizePendingItems(order.items).map((item) => item.product_id),
    );
    const products = await listProductsByIds(productIds);
    const productsById = new Map(products.map((product) => [product.id, product]));

    return pendingOrders.map((order) => {
      const items = normalizePendingItems(order.items).map((item) => {
        const product = productsById.get(item.product_id);
        return {
          ...item,
          product,
          line_total: product ? product.price * item.quantity : 0,
        };
      });

      return {
        ...order,
        items,
        total: items.reduce((sum, item) => sum + item.line_total, 0),
      };
    });
  } catch (error) {
    throw normalizeError(error, 'Impossible de charger les paniers en attente.');
  }
}

export async function cancelPendingOrder(pendingOrderId) {
  try {
    if (!pendingOrderId) {
      throw new Error('Commande introuvable.');
    }

    await callAdminRpc('admin_cancel_pending_order', {
      input_pending_order_id: pendingOrderId,
    });

    dispatchPendingOrdersUpdated();
  } catch (error) {
    throw normalizeError(error, "Impossible d'annuler cette commande.");
  }
}

export function notifyPendingOrdersUpdated() {
  dispatchPendingOrdersUpdated();
}
