const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function fechaLinda(str: string): string {
  if (!str) return "";
  const [y, m, d] = str.split("-");
  const dt = new Date(Number(y), Number(m) - 1, Number(d));
  return `${DIAS[dt.getDay()]} ${d}/${m}/${y}`;
}

export function sumarDia(str: string): string {
  const d = new Date(str + "T12:00:00");
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function restarDia(str: string): string {
  const d = new Date(str + "T12:00:00");
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
