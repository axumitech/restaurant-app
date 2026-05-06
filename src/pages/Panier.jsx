import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

import { getCart, updateQuantity, clearCart, saveCart } from '../lib/cartStore';
import { formatCurrency } from '../lib/currency';
import { createPendingOrder } from '../services/pendingOrders';
import { listProductsByIds } from '../services/products';
import Header from '../components/Restaurant/Header';
import CartItem from '../components/Restaurant/CartItem';
import { Button } from '../components/ui/button';

export default function Panier() {
  const MotionDiv = motion.div;
  const [cart, setCart] = useState(getCart());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setCart(getCart());
    window.addEventListener('cart-updated', handleUpdate);
    return () => window.removeEventListener('cart-updated', handleUpdate);
  }, []);

  useEffect(() => {
    let active = true;

    async function refreshCartPrices() {
      const currentCart = getCart();
      if (currentCart.length === 0) return;

      try {
        const products = await listProductsByIds(currentCart.map((item) => item.product_id));
        const productsById = new Map(products.map((product) => [product.id, product]));
        const refreshedCart = currentCart
          .map((item) => {
            const product = productsById.get(item.product_id);
            return product
              ? {
                  product_id: product.id,
                  name: product.name,
                  price: product.price,
                  image_url: product.image_url,
                  quantity: item.quantity,
                }
              : null;
          })
          .filter(Boolean);

        if (active) {
          saveCart(refreshedCart);
          setCart(refreshedCart);
        }
      } catch {
        toast.error('Impossible de vérifier les prix du panier');
      }
    }

    refreshCartPrices();

    return () => {
      active = false;
    };
  }, []);

  const handleUpdateQuantity = (productId, quantity) => {
    updateQuantity(productId, quantity);
    setCart(getCart());
  };

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const handleSendToManager = async () => {
    if (cart.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }

    setLoading(true);

    try {
      await createPendingOrder(
        cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      );

      clearCart();
      toast.success("Commande envoyée à l'admin");
    } catch (error) {
      toast.error(error.message || "Impossible d'envoyer la commande");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-inter">
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-5">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au menu
        </Link>

        <h2 className="font-inter font-bold text-foreground text-2xl mb-6">Votre panier</h2>

        {cart.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-inter text-muted-foreground">Votre panier est vide</p>
            <Link
              to="/"
              className="inline-block mt-4 text-primary font-inter font-semibold text-sm hover:underline"
            >
              Parcourir le menu
            </Link>
          </div>
        ) : (
          <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {cart.map((item) => (
              <CartItem key={item.product_id} item={item} onUpdateQuantity={handleUpdateQuantity} />
            ))}

            <div className="bg-card rounded-2xl border border-border p-5 mt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="font-inter text-muted-foreground text-sm">Total estimé</span>
                <span className="font-inter font-black text-foreground text-2xl">
                  {formatCurrency(total)}
                </span>
              </div>

              <Button
                onClick={handleSendToManager}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-inter font-bold text-base py-6 rounded-2xl hover:shadow-lg hover:shadow-primary/20 transition-all"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Send className="w-5 h-5 mr-2" />
                )}
                {loading ? 'Envoi en cours...' : "Envoyer la commande à l'admin"}
              </Button>
            </div>
          </MotionDiv>
        )}
      </div>
    </div>
  );
}
