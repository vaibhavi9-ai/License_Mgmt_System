export function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}
export function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}
