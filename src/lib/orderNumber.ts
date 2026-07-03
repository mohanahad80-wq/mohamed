export function generateOrderNumber() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `MS-${Date.now().toString(36).toUpperCase()}-${rand}`;
}
