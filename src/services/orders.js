import { callAdminRpc } from './adminRpc';
import { notifyPendingOrdersUpdated } from './pendingOrders';

function normalizeError(error, fallbackMessage) {
  if (error instanceof Error) {
    return error;
  }

  return new Error(error?.message || fallbackMessage);
}

function dispatchOrdersUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('orders-updated'));
  }
}

function mapItemsByOrderId(items) {
  return (items || []).reduce((accumulator, item) => {
    if (!accumulator[item.order_id]) {
      accumulator[item.order_id] = [];
    }

    accumulator[item.order_id].push({
      ...item,
      unit_price: Number(item.unit_price || 0),
      total_price: Number(item.total_price || 0),
    });
    return accumulator;
  }, {});
}

async function fetchOrderItemsByOrderIds(orderIds) {
  if (!orderIds.length) {
    return {};
  }

  const data = await callAdminRpc('admin_list_order_items', {
    input_order_ids: orderIds,
  });

  return mapItemsByOrderId(data || []);
}

export async function listOrders() {
  try {
    const data = await callAdminRpc('admin_list_orders');
    const orders = data || [];
    const itemsByOrderId = await fetchOrderItemsByOrderIds(orders.map((order) => order.id));

    return orders.map((order) => ({
      ...order,
      clients: {
        id: order.client_id,
        name: order.client_name,
        phone: order.client_phone,
      },
      total_amount: Number(order.total_amount || 0),
      paid_amount: Number(order.paid_amount || 0),
      remaining_amount: Number(order.remaining_amount || 0),
      items: itemsByOrderId[order.id] || [],
    }));
  } catch (error) {
    throw normalizeError(error, 'Impossible de charger les commandes.');
  }
}

export async function validatePendingOrder({
  pendingOrderId,
  clientId,
  paymentType,
  paidAmount,
}) {
  try {
    if (!clientId) {
      throw new Error('Selectionnez un client.');
    }

    const orderId = await callAdminRpc('admin_validate_pending_order', {
      input_pending_order_id: pendingOrderId,
      input_client_id: clientId,
      input_payment_type: paymentType,
      input_paid_amount: Number(paidAmount || 0),
    });

    notifyPendingOrdersUpdated();
    dispatchOrdersUpdated();

    return { id: orderId };
  } catch (error) {
    throw normalizeError(error, 'Impossible de valider la commande.');
  }
}
