import { cn } from '@/core/lib/utils';
import { Platform, TextInput } from 'react-native';

function Textarea({
  className,
  multiline = true,
  numberOfLines = Platform.select({ web: 2, native: 8 }), // On web, numberOfLines also determines initial height. On native, it determines the maximum height.
  placeholderClassName,
  ...props
}: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      className={cn(
        'bg-muted text-foreground flex min-h-[112px] w-full flex-row rounded-2xl px-4 py-3 text-base leading-5',
        props.editable === false && 'opacity-50',
        Platform.select({
          web: cn(
            'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground outline-none transition-[color,box-shadow] md:text-sm',
            'focus-visible:ring-primary/50 focus-visible:ring-[3px] resize-y field-sizing-content',
          ),
          native: 'placeholder:text-muted-foreground/50',
        }),
        className
      )}
      placeholderClassName={cn('text-muted-foreground', placeholderClassName)}
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical="top"
      {...props}
    />
  );
}

export { Textarea };
