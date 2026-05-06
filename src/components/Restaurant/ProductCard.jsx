import React, { useState } from 'react';
import { Plus, Check, Ban } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import { addToCart } from '../../lib/cartStore';
import { formatCurrency } from '../../lib/currency';
import { getProductImageUrl } from '../../lib/productImages';

function ProductCard({ product }) {
  const MotionDiv = motion.div;
  const [added, setAdded] = useState(false);
  const unavailable = product.available === false;

  const handleAdd = () => {
    if (unavailable) return;
    addToCart(product);
    setAdded(true);
    toast.success(`${product.name} ajoute au panier`);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-2xl overflow-hidden border transition-all ${
        unavailable
          ? 'border-border opacity-60'
          : 'border-border group hover:border-primary/30'
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={getProductImageUrl(product.image_url)}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-cover transition-transform duration-500 ${
            !unavailable ? 'group-hover:scale-105' : 'grayscale'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {unavailable && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/70 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
              <Ban className="w-3.5 h-3.5 text-red-400" />
              <span className="font-inter font-semibold text-red-400 text-xs">Indisponible</span>
            </div>
          </div>
        )}

        <div className="absolute bottom-3 left-3">
          <span className="bg-primary text-primary-foreground font-inter font-bold text-sm px-3 py-1 rounded-full">
            {formatCurrency(product.price)}
          </span>
        </div>
      </div>

      <div className="p-3 flex items-center justify-between gap-3">
        <h3 className="font-inter font-semibold text-foreground text-sm leading-tight flex-1 min-w-0 truncate">
          {product.name}
        </h3>
        <button
          type="button"
          onClick={handleAdd}
          disabled={unavailable}
          className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            unavailable
              ? 'bg-secondary text-muted-foreground cursor-not-allowed'
              : added
                ? 'bg-green-500 text-white'
                : 'bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/30 active:scale-90'
          }`}
        >
          {unavailable ? (
            <Ban className="w-4 h-4" />
          ) : added ? (
            <Check className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </button>
      </div>
    </MotionDiv>
  );
}

export default React.memo(ProductCard);
