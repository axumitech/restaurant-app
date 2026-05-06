export function formatCurrency(value) {
  const amount = Number(value || 0);
  const formatted = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);

  return `${formatted.replace(/[\u00a0\u202f]/g, ' ')} FC`;
}
