/**
 * Parsea un monto de cartola bancaria a pesos chilenos (sin centavos en la
 * práctica). Acepta "." o "," como separador de miles o de decimales, signo
 * y símbolo de moneda opcionales. Siempre devuelve un valor positivo (el
 * signo de la fila no determina el tipo de movimiento; eso lo elige el
 * usuario en el importador).
 */
export function parseFlexibleAmount(value: string): number | null {
  const trimmed = value.trim().replace(/[^0-9.,-]/g, "");
  if (!trimmed) return null;

  const digitsOnly = trimmed.replace(/-/g, "");
  if (!digitsOnly) return null;

  const separators = digitsOnly.match(/[.,]/g) ?? [];

  let normalized: string;

  if (separators.length === 0) {
    normalized = digitsOnly;
  } else {
    const distinctChars = new Set(separators);
    const lastSepIndex = Math.max(digitsOnly.lastIndexOf("."), digitsOnly.lastIndexOf(","));
    const digitsAfterLastSep = digitsOnly.length - lastSepIndex - 1;

    // Dos tipos de separador presentes (ej "1.234,56"): el último es el
    // decimal, los anteriores son de miles.
    if (distinctChars.size === 2) {
      const decimalChar = digitsOnly[lastSepIndex];
      const thousandsChar = decimalChar === "," ? "." : ",";
      normalized =
        digitsOnly.split(thousandsChar).join("").replace(decimalChar, ".");
    } else if (separators.length > 1) {
      // El mismo separador repetido (ej "1.234.567") solo puede ser de miles.
      normalized = digitsOnly.replace(/[.,]/g, "");
    } else if (digitsAfterLastSep === 3) {
      // Un solo separador con 3 dígitos después: de miles (CLP no usa
      // centavos), ej "25.000" = 25000.
      normalized = digitsOnly.replace(/[.,]/g, "");
    } else {
      // Un solo separador con 1-2 dígitos después: decimal.
      normalized = `${digitsOnly.slice(0, lastSepIndex)}.${digitsOnly.slice(lastSepIndex + 1)}`;
    }
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;

  return Math.abs(parsed);
}
