/**
 * Parsea un input <input type="date"> ("YYYY-MM-DD") como medianoche en la
 * zona horaria local, no UTC. Evita que la fecha se corra un día al
 * mostrarla (new Date("YYYY-MM-DD") nativo interpreta el string como UTC).
 */
export function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Formatea una fecha como "YYYY-MM-DD" en hora local, para <input type="date">. */
export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Formatea una fecha como "YYYY-MM" en hora local, para selectores de mes. */
export function toMonthParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/** Parsea un parámetro de mes "YYYY-MM"; si no es válido, usa el mes actual. */
export function parseMonthParam(value: string | undefined): Date {
  if (value) {
    const match = value.match(/^(\d{4})-(\d{1,2})$/);
    if (match) {
      const [, year, month] = match;
      return new Date(Number(year), Number(month) - 1, 1);
    }
  }
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
}

/**
 * Parsea una fecha de cartola bancaria en formato "YYYY-MM-DD", "DD-MM-YYYY"
 * o "DD/MM/YYYY". Devuelve null si no calza con ninguno (el usuario deberá
 * corregir la fila antes de importar).
 */
export function parseFlexibleDate(value: string): Date | null {
  const trimmed = value.trim();

  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return null;
}
