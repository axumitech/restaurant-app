export const PRODUCT_CATEGORIES = [
  { value: 'plats_congolais', label: 'Plats congolais' },
  { value: 'grillades', label: 'Grillades' },
  { value: 'accompagnements', label: 'Accompagnements' },
  { value: 'boissons', label: 'Boissons' },
  { value: 'desserts', label: 'Desserts' },
];

export const DEFAULT_PRODUCT_CATEGORY = PRODUCT_CATEGORIES[0].value;

export function getCategoryLabel(value) {
  return PRODUCT_CATEGORIES.find((category) => category.value === value)?.label || value;
}
