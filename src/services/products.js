import { getSupabaseClient } from '../lib/supabase';
import { getProductImageUrl } from '../lib/productImages';
import { callAdminRpc } from './adminRpc';
import { getAdminToken } from './adminAuth';
import { toast } from 'sonner';

const PRODUCT_COLUMNS = 'id, name, price, category, image_url, available, created_at';
const PRODUCTS_CACHE_KEY = 'restaurant_products_cache_v1';
const AVAILABLE_PRODUCTS_CACHE_KEY = 'restaurant_available_products_cache_v1';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readCache(key) {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCache(key, products) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(products));
  } catch {
    // Ignore cache write failures.
  }
}

function clearProductsCache() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(PRODUCTS_CACHE_KEY);
  window.localStorage.removeItem(AVAILABLE_PRODUCTS_CACHE_KEY);
}

function normalizeProducts(products) {
  return (products || []).map((product) => ({
    ...product,
    price: Number(product.price || 0),
    image_url: getProductImageUrl(product.image_url),
  }));
}

function normalizeError(error, fallbackMessage) {
  if (error instanceof Error) {
    return error;
  }

  const message = error?.message || fallbackMessage;
  return new Error(message);
}

function dispatchProductsUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('products-updated'));
  }
}

function handleSupabaseError(error) {
  console.error(error);
  toast.error('Erreur serveur');
}

export function getCachedProducts() {
  return readCache(PRODUCTS_CACHE_KEY);
}

export function getCachedAvailableProducts() {
  return readCache(AVAILABLE_PRODUCTS_CACHE_KEY);
}

export async function listProducts() {
  try {
    const data = await callAdminRpc('admin_list_products');

    const products = normalizeProducts(data);
    writeCache(PRODUCTS_CACHE_KEY, products);
    writeCache(
      AVAILABLE_PRODUCTS_CACHE_KEY,
      products.filter((product) => product.available === true),
    );

    return products;
  } catch (error) {
    throw normalizeError(error, 'Impossible de charger les produits.');
  }
}

export async function listAvailableProducts() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_COLUMNS)
      .eq('available', true)
      .order('created_at', { ascending: false });

    if (error) {
      handleSupabaseError(error);
      throw error;
    }

    const products = normalizeProducts(data);
    writeCache(AVAILABLE_PRODUCTS_CACHE_KEY, products);

    return products;
  } catch (error) {
    throw normalizeError(error, 'Impossible de charger les produits disponibles.');
  }
}

export async function listProductsByIds(productIds) {
  const ids = [...new Set((productIds || []).filter(Boolean))];

  if (ids.length === 0) {
    return [];
  }

  try {
    if (getAdminToken()) {
      const data = await callAdminRpc('admin_list_products_by_ids', {
        input_product_ids: ids,
      });

      return normalizeProducts(data);
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('products').select(PRODUCT_COLUMNS).in('id', ids);

    if (error) {
      handleSupabaseError(error);
      throw error;
    }
    return normalizeProducts(data);
  } catch (error) {
    throw normalizeError(error, 'Impossible de charger les produits du panier.');
  }
}

export async function createProduct(product) {
  try {
    const data = await callAdminRpc('admin_create_product', {
      input_name: product.name,
      input_price: product.price,
      input_category: product.category,
      input_image_url: product.image_url || '',
      input_available: product.available,
    });
    const createdProduct = Array.isArray(data) ? data[0] : data;

    clearProductsCache();
    dispatchProductsUpdated();
    return createdProduct
      ? { ...createdProduct, image_url: getProductImageUrl(createdProduct.image_url) }
      : createdProduct;
  } catch (error) {
    throw normalizeError(error, 'Impossible de créer le produit.');
  }
}

export async function updateProduct(productId, updates) {
  try {
    const data = await callAdminRpc('admin_update_product', {
      input_product_id: productId,
      input_name: updates.name,
      input_price: updates.price,
      input_category: updates.category,
      input_image_url: updates.image_url || '',
      input_available: updates.available,
    });
    const updatedProduct = Array.isArray(data) ? data[0] : data;

    clearProductsCache();
    dispatchProductsUpdated();
    return updatedProduct || { id: productId, ...updates };
  } catch (error) {
    throw normalizeError(error, 'Impossible de mettre à jour le produit.');
  }
}

export async function deleteProduct(productId) {
  try {
    await callAdminRpc('admin_delete_product', {
      input_product_id: productId,
    });

    clearProductsCache();
    dispatchProductsUpdated();
  } catch (error) {
    throw normalizeError(error, 'Impossible de supprimer le produit.');
  }
}
