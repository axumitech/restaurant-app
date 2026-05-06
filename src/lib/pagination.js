export function getPageCount(totalItems, pageSize) {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function paginate(items, page, pageSize) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
