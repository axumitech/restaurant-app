import {
  Beef,
  Croissant,
  CupSoda,
  LeafyGreen,
  UtensilsCrossed,
  Wheat,
} from 'lucide-react';

export const CATEGORY_ICONS = {
  condiments: Beef,
  accompagnements: Wheat,
  legumes: LeafyGreen,
  petit_dejeuner: Croissant,
  boissons: CupSoda,
};

export const CATEGORY_BADGE_ICONS = {
  condiments: <Beef className="h-4 w-4" />,
  accompagnements: <Wheat className="h-4 w-4" />,
  legumes: <LeafyGreen className="h-4 w-4" />,
  petit_dejeuner: <Croissant className="h-4 w-4" />,
  boissons: <CupSoda className="h-4 w-4" />,
  default: <UtensilsCrossed className="h-4 w-4" />,
};

export function getCategoryIcon(categoryValue) {
  return CATEGORY_ICONS[categoryValue] || UtensilsCrossed;
}
