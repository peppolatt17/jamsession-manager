export function normalizeItalianDigits(raw: string): string {
  // Extract digits only
  const digits = (raw || '').replace(/\D+/g, '');
  if (!digits) return '';

  // Handle different country code representations
  // - Starts with 0039 => convert to 39
  if (digits.startsWith('0039')) {
    return '39' + digits.slice(4);
  }

  // - Already starts with 39 (international without plus)
  if (digits.startsWith('39')) {
    return digits;
  }

  // Otherwise assume Italian local number and prefix 39
  return '39' + digits;
}

export function toWhatsAppUrl(rawPhone: string): string {
  const normalized = normalizeItalianDigits(rawPhone);
  if (!normalized) return '#';
  // wa.me expects international number without '+' and non-digit chars
  return `https://wa.me/${normalized}`;
}

export function formatItalianDisplay(rawPhone: string): string {
  const normalized = normalizeItalianDigits(rawPhone);
  if (!normalized) return '';
  // Display with +39 prefix
  return `+${normalized.slice(0, 2)} ${normalized.slice(2)}`;
}

