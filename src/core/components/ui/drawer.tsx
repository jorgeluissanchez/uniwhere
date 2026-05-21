import { cn } from '@/core/lib/utils';
import * as DialogPrimitive from '@rn-primitives/dialog';
import * as React from 'react';
import { Dimensions, Platform, View } from 'react-native';
import {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideInLeft,
  SlideInRight,
  SlideOutDown,
  SlideOutLeft,
  SlideOutRight,
} from 'react-native-reanimated';
import { NativeOnlyAnimatedView } from './native-only-animated-view';

const Drawer = DialogPrimitive.Root;
const DrawerTrigger = DialogPrimitive.Trigger;
const DrawerPortal = DialogPrimitive.Portal;
const DrawerClose = DialogPrimitive.Close;

type Side = 'left' | 'right' | 'bottom';

function DrawerOverlay({ className, children, ...props }: any) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'absolute inset-0 bg-black/50',
        Platform.select({
          web:
            'fixed animate-in fade-in-0 duration-300 ease-out ' +
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-200',
        }),
        className,
      )}
      {...props}
      asChild={Platform.OS !== 'web'}>
      <NativeOnlyAnimatedView entering={FadeIn.duration(280)} exiting={FadeOut.duration(220)}>
        <>{children}</>
      </NativeOnlyAnimatedView>
    </DialogPrimitive.Overlay>
  );
}

function getLayout(side: Side) {
  switch (side) {
    case 'left':
      return {
        position: 'absolute top-0 bottom-0 left-0 w-full max-w-xs',
        in: SlideInLeft,
        out: SlideOutLeft,
        webIn: 'slide-in-from-left',
        webOut: 'slide-out-to-left',
      };
    case 'bottom':
      return {
        position: 'absolute left-0 right-0 bottom-0 w-full rounded-t-2xl max-h-[90%]',
        in: SlideInDown,
        out: SlideOutDown,
        webIn: 'slide-in-from-bottom',
        webOut: 'slide-out-to-bottom',
      };
    default:
      return {
        position: 'absolute top-0 bottom-0 right-0 w-full max-w-xs',
        in: SlideInRight,
        out: SlideOutRight,
        webIn: 'slide-in-from-right',
        webOut: 'slide-out-to-right',
      };
  }
}

function DrawerContent({ className, portalHost, children, side, ...props }: any) {
  const resolvedSide: Side = side ?? (Dimensions.get('window').width < 768 ? 'bottom' : 'right');
  const layout = getLayout(resolvedSide);
  return (
    <DrawerPortal hostName={portalHost}>
      <DrawerOverlay>
        <DialogPrimitive.Content
          className={cn(
            'z-50 bg-background border-border p-4 shadow-lg',
            layout.position,
            Platform.select({
              web:
                `animate-in ${layout.webIn} fade-in duration-300 ease-out ` +
                `data-[state=closed]:animate-out data-[state=closed]:${layout.webOut} data-[state=closed]:fade-out data-[state=closed]:duration-200`,
            }),
            className,
          )}
          asChild={Platform.OS !== 'web'}
          {...props}>
          <NativeOnlyAnimatedView
            entering={layout.in.springify().damping(22).mass(0.9)}
            exiting={layout.out.duration(220)}>
            {children}
          </NativeOnlyAnimatedView>
        </DialogPrimitive.Content>
      </DrawerOverlay>
    </DrawerPortal>
  );
}

function DrawerHeader(props: any) {
  return <View className={cn('flex flex-col gap-2', props.className)} {...props} />;
}

function DrawerFooter(props: any) {
  return <View className={cn('flex items-center justify-end gap-2', props.className)} {...props} />;
}

function DrawerTitle(props: any) {
  return <DialogPrimitive.Title className={cn('text-lg font-semibold', props.className)} {...props} />;
}

function DrawerDescription(props: any) {
  return <DialogPrimitive.Description className={cn('text-sm text-muted-foreground', props.className)} {...props} />;
}

export { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger };
