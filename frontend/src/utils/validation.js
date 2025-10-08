export function validateEmail(email) {
  return /^[\\w-.]+@([\\w-]+\\.)+[\\w-]{2,4}$/.test(email);
}
export function validatePhone(phone) {
  return /^\\+?\\d{10,14}$/.test(phone);
}
export function validateRequired(value) {
  return value !== undefined && value !== null && value !== "";
}
