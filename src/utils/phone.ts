/**
 * Phone number auto-hyphen formatter for Korean phone numbers.
 * Formats digits to 010-0000-0000 or 010-000-0000 format up to 11 digits max.
 */
export const formatPhoneNumber = (value: string): string => {
  if (!value) return '';
  const nums = value.replace(/[^0-9]/g, '').slice(0, 11);
  if (nums.length < 4) return nums;
  if (nums.length < 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
  if (nums.length < 11) return `${nums.slice(0, 3)}-${nums.slice(3, 6)}-${nums.slice(6)}`;
  return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7)}`;
};
