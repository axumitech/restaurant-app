import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { getCartCount, getCartTotal } from '../../lib/cartStore';
import { formatCurrency } from '../../lib/currency';

export default function FloatingCartButton() {
  const MotionDiv = motion.div;
  const [count, setCount] = useState(getCartCount());
  const [total, setTotal] = useState(getCartTotal());

  useEffect(() => {
    const handleUpdate = () => {
      setCount(getCartCount());
      setTotal(getCartTotal());
    };

    window.addEventListener('cart-updated', handleUpdate);
    return () => window.removeEventListener('cart-updated', handleUpdate);
  }, []);

  if (count === 0) return null;

  return (
    <AnimatePresence>
      <MotionDiv
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8"
      >
        <div className="max-w-3xl mx-auto">
          <Link
            to="/panier"
            className="flex items-center justify-between w-full bg-primary text-primary-foreground rounded-2xl px-5 py-4 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBag className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-background text-foreground text-xs font-inter font-bold rounded-full flex items-center justify-center">
                  {count}
                </span>
              </div>
              <span className="font-inter font-bold text-base">Voir le panier</span>
            </div>
            <span className="font-inter font-bold text-base">{formatCurrency(total)}</span>
          </Link>
        </div>
      </MotionDiv>
    </AnimatePresence>
  );
}
