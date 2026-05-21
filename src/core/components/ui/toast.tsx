import { Portal } from '@rn-primitives/portal';
import * as ToastPrimitive from '@rn-primitives/toast';
import { AlertCircleIcon, CheckCircle2Icon } from 'lucide-react-native';
import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Alert, AlertDescription, AlertTitle } from './alert';

type ToastVariant = 'default' | 'destructive';

type ToastOptions = {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastContextType = {
  show: (messageOrOptions: string | ToastOptions, options?: ToastOptions) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [variant, setVariant] = React.useState<ToastVariant>('default');
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = (messageOrOptions: string | ToastOptions, options?: ToastOptions) => {
    const resolvedOptions = typeof messageOrOptions === 'string'
      ? { title: options?.title ?? 'Notice', description: messageOrOptions, ...options }
      : messageOrOptions;
    const duration = resolvedOptions.duration ?? 3000;
    setTitle(resolvedOptions.title ?? 'Notice');
    setDescription(resolvedOptions.description ?? '');
    setVariant(resolvedOptions.variant ?? 'default');
    setOpen(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    timerRef.current = setTimeout(() => {
      setOpen(false);
      timerRef.current = null;
    }, duration);
  };

  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <Portal name="toast">
        {open && (
          <View style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0, paddingHorizontal: 16 }}>
            <ToastPrimitive.Root open={open} onOpenChange={setOpen} type="foreground">
              <Alert icon={variant === 'destructive' ? AlertCircleIcon : CheckCircle2Icon} variant={variant}>
                <AlertTitle>{title}</AlertTitle>
                {!!description && <AlertDescription>{description}</AlertDescription>}
                <ToastPrimitive.Close asChild>
                  <Pressable className="absolute right-3 top-3 rounded-full p-2">
                    <View className="h-2.5 w-2.5 rounded-full bg-foreground/50" />
                  </Pressable>
                </ToastPrimitive.Close>
              </Alert>
            </ToastPrimitive.Root>
          </View>
        )}
      </Portal>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

export default ToastProvider;
