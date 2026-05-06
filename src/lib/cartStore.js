// Simple cart state management using localStorage
const CART_KEY = 'restaurant_cart';

export function getCart() {
  try {
    const data = localStorage.getItem(CART_KEY);
    const cart = data ? JSON.parse(data) : [];
    return cart.map((item) => ({
      product_id: item.product_id || item.produit_id,
      name: item.name || item.nom || '',
      price: Number(item.price ?? item.prix ?? 0),
      image_url: item.image_url || '',
      quantity: Number(item.quantity ?? item.quantite ?? 1),
    })).filter((item) => item.product_id);
  } catch {
    return [];
  }
}

export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('cart-updated'));
}

export function addToCart(product) {
  const cart = getCart();
  const existing = cart.find((item) => item.product_id === product.id);
  if (existing) {
    existing.quantity += 1;
    existing.name = product.name;
    existing.price = product.price;
    existing.image_url = product.image_url;
  } else {
    cart.push({
      product_id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      quantity: 1
    });
  }
  saveCart(cart);
}

export function updateQuantity(productId, quantity) {
  let cart = getCart();
  if (quantity <= 0) {
    cart = cart.filter((item) => item.product_id !== productId);
  } else {
    const item = cart.find((item) => item.product_id === productId);
    if (item) item.quantity = quantity;
  }
  saveCart(cart);
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event('cart-updated'));
}

export function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}
