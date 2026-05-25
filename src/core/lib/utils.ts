import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'text-color': [
        {
          text: [
            'foreground', 'card-foreground', 'popover-foreground',
            'primary-foreground', 'secondary-foreground', 'muted-foreground',
            'accent-foreground', 'destructive-foreground',
          ],
        },
      ],
      'font-family': ['font-cal', 'font-abeezee'],
      'bg-color': [
        {
          bg: [
            'background', 'foreground', 'card', 'card-foreground',
            'popover', 'popover-foreground', 'primary', 'primary-foreground',
            'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
            'accent', 'accent-foreground', 'destructive', 'destructive-foreground',
            'border', 'input', 'ring',
          ],
        },
      ],
      'border-color': [
        {
          border: [
            'border', 'input', 'ring', 'primary', 'secondary',
            'destructive', 'accent', 'muted',
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
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