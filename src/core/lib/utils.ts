import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isSessionExpiredError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");

  return (
    message.includes("Error al renovar el token") ||
    message.includes("No autorizado (problema con el token)") ||
    message.includes("token inválido") ||
    message.includes("Token inválido") ||
    message.includes("expired token")
  );
}

export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; continue; }
    current += ch;
  }
  result.push(current.trim());
  return result;
}