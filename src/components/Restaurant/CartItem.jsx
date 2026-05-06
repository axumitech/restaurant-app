import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../lib/currency';
import { getProductImageUrl } from '../../lib/productImages';

export default function CartItem({ item, onUpdateQuantity }) {
  return (
    <div className="flex gap-4 bg-card rounded-2xl p-3 border border-border">
      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
        <img
          src={getProductImageUrl(item.image_url)}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="font-inter font-semibold text-foreground text-sm truncate">
            {item.name}
          </h3>
          <p className="font-inter font-bold text-primary text-sm mt-0.5">
            {formatCurrency(item.price)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
            className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            {item.quantity === 1 ? <Trash2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          </button>
          <span className="font-inter font-bold text-foreground w-6 text-center text-sm">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
            className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:shadow-lg hover:shadow-primary/20 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
          <span className="ml-auto font-inter font-bold text-foreground text-sm">
            {formatCurrency(item.price * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
}
