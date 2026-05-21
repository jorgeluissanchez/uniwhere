import { cn } from '@/core/lib/utils';
import { Platform, TextInput } from 'react-native';

function Input({ className, ...props }: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      className={cn(
        'bg-muted text-foreground flex h-14 w-full min-w-0 flex-row items-center rounded-2xl px-4 py-1 text-base leading-5',
        props.editable === false &&
          cn(
            'opacity-50',
            Platform.select({ web: 'disabled:pointer-events-none disabled:cursor-not-allowed' })
          ),
        Platform.select({
          web: cn(
            'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground outline-none transition-[color,box-shadow] md:text-sm',
            'focus-visible:ring-primary/50 focus-visible:ring-[3px]',
          ),
          native: 'placeholder:text-muted-foreground/50',
        }),
        className
      )}
      {...props}
    />
  );
}

export { Input };
