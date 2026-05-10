import React from 'react';
import { Coffee, CupSoda, Drumstick, Leaf, Soup, UtensilsCrossed } from 'lucide-react';

import { PRODUCT_CATEGORIES } from '../../lib/categories';

const categoryIcons = {
  condiments: Soup,
  accompagnements: Drumstick,
  legumes: Leaf,
  petit_dejeuner: Coffee,
  boissons: CupSoda,
};

const categories = PRODUCT_CATEGORIES.map((category) => ({
  ...category,
  id: category.value,
  icon: categoryIcons[category.value] || UtensilsCrossed,
}));

export default function CategoryNav({ active, onSelect }) {
  return (
    <div className="sticky top-[57px] z-40 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isActive = active === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelect(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-inter font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
