import { TextClassContext } from '@/core/components/ui/text';
import { cn } from '@/core/lib/utils';
import { cssInterop } from 'nativewind';
import * as React from 'react';
import { ActivityIndicator } from 'react-native';

// `ActivityIndicator` pinta con la prop `color`, no con estilos, así que sin
// esto habría que pasarle un color resuelto desde JS. El interop traduce el
// `color` de la clase (`text-primary`, `text-primary-foreground`…) a esa prop.
const SpinnerImpl = cssInterop(ActivityIndicator, {
  className: {
    target: 'style',
    nativeStyleToProp: { color: true },
  },
});

type SpinnerProps = React.ComponentProps<typeof ActivityIndicator>;

/**
 * `ActivityIndicator` que toma el color desde utilidades de Tailwind.
 *
 * Dentro de un `Button` hereda el color de texto de la variante, igual que
 * `Icon`, así que en la mayoría de los casos no necesita className propio.
 *
 * @example
 * ```tsx
 * <Spinner className="text-primary" size="large" />
 * ```
 */
function Spinner({ className, ...props }: SpinnerProps) {
  const textClass = React.useContext(TextClassContext);
  return <SpinnerImpl className={cn('text-foreground', textClass, className)} {...props} />;
}

export { Spinner };
