export const PRODUCT_CATEGORIES = [
  { value: 'condiments', label: 'Condiments' },
  { value: 'accompagnements', label: 'Accompagnements' },
  { value: 'legumes', label: 'Légumes' },
  /* { value: 'petit_dejeuner', label: 'Petit déjeuner' }, */
  { value: 'boissons', label: 'Boissons' },
];

export const DEFAULT_PRODUCT_CATEGORY = PRODUCT_CATEGORIES[0].value;

export function getCategoryLabel(value) {
  return PRODUCT_CATEGORIES.find((category) => category.value === value)?.label || value;
}
