/**
 * Parsea un input <input type="date"> ("YYYY-MM-DD") como medianoche en la
 * zona horaria local, no UTC. Evita que la fecha se corra un día al
 * mostrarla (new Date("YYYY-MM-DD") nativo interpreta el string como UTC).
 */
export function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}
