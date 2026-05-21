import { cn } from '@/core/lib/utils';
import { cva } from 'class-variance-authority';
import { getStringAsync } from 'expo-clipboard';
import React, {
    forwardRef,
    useCallback,
    useEffect,
    useRef,
    useState
} from 'react';
import {
    AccessibilityInfo,
    AccessibilityRole,
    Animated,
    I18nManager,
    NativeSyntheticEvent,
    Platform,
    Pressable,
    Text,
    TextInput,
    TextInputKeyPressEventData,
    View,
} from 'react-native';
import { Button } from './button';

// ─── Slot variants (replaces the external styles object) ─────────────────────

const slotVariants = cva(
  cn(
    'border-input bg-background text-foreground items-center justify-center',
    'border text-center font-semibold',
    Platform.select({ native: 'overflow-hidden' })
  ),
  {
    variants: {
      size: {
        sm: 'h-10 w-8 text-sm rounded-md',
        md: 'h-12 w-10 text-base rounded-md',
        lg: 'h-14 w-12 text-lg rounded-md',
      },
      position: {
        first: 'rounded-r-none border-r-0 rounded-l-md',
        middle: 'rounded-none border-r-0',
        last: 'rounded-l-none rounded-r-md',
        solo: 'rounded-md',
      },
      state: {
        default: '',
        active: 'border-ring z-10',
        filled: 'bg-muted/40',
        error: 'border-destructive',
        disabled: 'opacity-50',
      },
    },
    defaultVariants: {
      size: 'md',
      position: 'middle',
      state: 'default',
    },
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OTPInputProps {
  // Core
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;

  // Appearance
  disabled?: boolean;
  autoFocus?: boolean;
  separator?: boolean | React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  mask?: boolean;
  keyboard?: 'numeric' | 'default' | 'email-address' | 'phone-pad';
  error?: boolean | string;
  className?: string;

  // Validation
  validateChar?: (char: string, index: number) => boolean;
  allowedChars?: string | RegExp;

  // Auto-submission
  shouldAutoSubmit?: boolean;
  autoSubmitDelay?: number;

  // Expiry
  expiresIn?: number;
  onExpire?: () => void;
  showExpiryTimer?: boolean;

  // Resend
  onResend?: () => void;
  resendCooldown?: number;
  maxResendAttempts?: number;

  // Clipboard
  shouldHandleClipboard?: boolean;

  // Animation
  animate?: boolean;
  animationDuration?: number;

  // Accessibility
  ariaLabel?: string;
  errorAriaLabel?: string;

  // Testing
  testID?: string;

  // Form integration
  name?: string;
  onBlur?: () => void;
  onFocus?: () => void;
}

type OTPInputRef = {
  focus: () => void;
  blur: () => void;
  clear: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const OTPInput = forwardRef<OTPInputRef, OTPInputProps>(
  (
    {
      length = 6,
      value = '',
      onChange,
      onComplete,
      disabled = false,
      autoFocus = false,
      separator = false,
      size = 'md',
      mask = false,
      keyboard = 'numeric',
      error = false,
      className = '',
      validateChar,
      allowedChars,
      shouldAutoSubmit = true,
      autoSubmitDelay = 300,
      expiresIn = 0,
      onExpire,
      showExpiryTimer = false,
      onResend,
      resendCooldown = 30,
      maxResendAttempts = 3,
      shouldHandleClipboard = true,
      animate = true,
      animationDuration = 200,
      ariaLabel = 'OTP Input',
      errorAriaLabel = 'Error in OTP Input',
      testID = 'otp-input',
      onBlur: externalOnBlur,
      onFocus: externalOnFocus,
    },
    ref
  ) => {
    const [localValue, setLocalValue] = useState(value.slice(0, length));
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [focused, setFocused] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(expiresIn);
    const [resendAttempts, setResendAttempts] = useState(0);
    const [resendCountdown, setResendCountdown] = useState(0);

    const shakeAnimations = useRef(
      Array.from({ length }, () => new Animated.Value(0))
    ).current;
    const fadeAnimations = useRef(
      Array.from({ length }, () => new Animated.Value(1))
    ).current;

    const inputRefs = useRef<(TextInput | null)[]>([]);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const expiryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const clipboardCheckedRef = useRef(false);

    const isRTL = I18nManager.isRTL;
    const midPoint = Math.floor(length / 2);

    // ── Expiry timer ──────────────────────────────────────────────────────────
    useEffect(() => {
      if (expiresIn <= 0) return;
      setTimeRemaining(expiresIn);
      expiryTimerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(expiryTimerRef.current!);
            onExpire?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => { if (expiryTimerRef.current) clearInterval(expiryTimerRef.current); };
    }, [expiresIn, onExpire]);

    // ── Resend cooldown ───────────────────────────────────────────────────────
    useEffect(() => {
      if (resendCountdown <= 0) return;
      resendTimerRef.current = setInterval(() => {
        setResendCountdown(prev => {
          if (prev <= 1) { clearInterval(resendTimerRef.current!); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => { if (resendTimerRef.current) clearInterval(resendTimerRef.current); };
    }, [resendCountdown]);

    // ── Sync value prop ───────────────────────────────────────────────────────
    useEffect(() => {
      setLocalValue(value.slice(0, length));
      if (value.length === length && shouldAutoSubmit && onComplete) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => onComplete(value), autoSubmitDelay);
      }
    }, [value, length, shouldAutoSubmit, onComplete, autoSubmitDelay]);

    // ── Clipboard (expo-clipboard) ────────────────────────────────────────────
    useEffect(() => {
      if (!shouldHandleClipboard || !focused || clipboardCheckedRef.current) return;
      let mounted = true;

      (async () => {
        try {
          const raw = await getStringAsync();
          clipboardCheckedRef.current = true;
          if (!raw || !mounted || raw.length < length) return;

          let cleaned = raw;
          if (keyboard === 'numeric') cleaned = cleaned.replace(/\D/g, '');
          if (allowedChars instanceof RegExp) {
            cleaned = cleaned.split('').filter(c => (allowedChars as RegExp).test(c)).join('');
          } else if (typeof allowedChars === 'string') {
            cleaned = cleaned.split('').filter(c => allowedChars.includes(c)).join('');
          }

          const paste = cleaned.slice(0, length);
          if (!paste || !mounted) return;

          setLocalValue(paste);
          onChange(paste);
          const focusIdx = Math.min(paste.length, length - 1);
          inputRefs.current[focusIdx]?.focus();

          if (paste.length === length && shouldAutoSubmit && onComplete) {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => onComplete(paste), autoSubmitDelay);
          }
        } catch (e) {
          // clipboard unavailable — silent fail
        }
      })();

      return () => { mounted = false; };
    }, [focused, shouldHandleClipboard, length, onChange, allowedChars, keyboard, shouldAutoSubmit, onComplete, autoSubmitDelay]);

    // ── Validation ────────────────────────────────────────────────────────────
    const validateCharacter = useCallback(
      (char: string, index: number): boolean => {
        if (!char) return true;
        if (validateChar) return validateChar(char, index);
        if (allowedChars instanceof RegExp) return allowedChars.test(char);
        if (typeof allowedChars === 'string') return allowedChars.includes(char);
        if (keyboard === 'numeric') return /^\d$/.test(char);
        return true;
      },
      [validateChar, allowedChars, keyboard]
    );

    // ── Handle text change ────────────────────────────────────────────────────
    const handleChange = useCallback(
      (text: string, index: number) => {
        if (disabled) return;

        // Paste path (text.length > 1)
        if (text.length > 1) {
          let paste = text;
          if (keyboard === 'numeric') paste = paste.replace(/\D/g, '');
          if (allowedChars instanceof RegExp) {
            paste = paste.split('').filter(c => (allowedChars as RegExp).test(c)).join('');
          } else if (typeof allowedChars === 'string') {
            paste = paste.split('').filter(c => allowedChars.includes(c)).join('');
          }

          const chars = paste.split('');
          const newValue = localValue.split('');
          const valid: string[] = [];

          chars.forEach((char, i) => {
            const target = index + i;
            if (target < length && validateCharacter(char, target)) {
              newValue[target] = char;
              valid.push(char);
            }
          });

          if (valid.length > 0) {
            const next = newValue.join('');
            setLocalValue(next);
            onChange(next);
            const firstEmpty = newValue.findIndex(c => !c);
            const focusIdx = firstEmpty !== -1 ? firstEmpty : Math.min(index + valid.length, length - 1);
            inputRefs.current[focusIdx]?.focus();
            if (next.replace(/\s/g, '').length === length && shouldAutoSubmit && onComplete) {
              if (timerRef.current) clearTimeout(timerRef.current);
              timerRef.current = setTimeout(() => onComplete(next), autoSubmitDelay);
            }
          }
          return;
        }

        // Single char path
        if (text && !validateCharacter(text, index)) {
          if (animate) {
            Animated.sequence([
              Animated.timing(shakeAnimations[index], { toValue: 10, duration: animationDuration / 4, useNativeDriver: true }),
              Animated.timing(shakeAnimations[index], { toValue: -10, duration: animationDuration / 2, useNativeDriver: true }),
              Animated.timing(shakeAnimations[index], { toValue: 0, duration: animationDuration / 4, useNativeDriver: true }),
            ]).start();
          }
          return;
        }

        const newValue = localValue.split('');
        newValue[index] = text;
        const next = newValue.join('');
        setLocalValue(next);
        onChange(next);

        if (text && !localValue[index] && index < length - 1) {
          inputRefs.current[index + 1]?.focus();
        }

        if (next.length === length && shouldAutoSubmit && onComplete) {
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => onComplete(next), autoSubmitDelay);
        }
      },
      [disabled, length, localValue, onChange, validateCharacter, shouldAutoSubmit, onComplete, autoSubmitDelay, animate, shakeAnimations, animationDuration, keyboard, allowedChars]
    );

    // ── Backspace / key press ─────────────────────────────────────────────────
    const handleKeyPress = useCallback(
      (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
        if (e.nativeEvent.key !== 'Backspace') return;
        if (localValue[index]) {
          const nv = localValue.split('');
          nv[index] = '';
          const next = nv.join('');
          setLocalValue(next);
          onChange(next);
        } else if (index > 0) {
          inputRefs.current[index - 1]?.focus();
        }
      },
      [localValue, onChange]
    );

    // ── Arrow key navigation (web only) ──────────────────────────────────────
    const handleKeyDown = useCallback(
      (e: any, index: number) => {
        if (!e.nativeEvent || disabled) return;
        const key = e.nativeEvent.key;
        if (key === 'ArrowLeft') {
          const prev = isRTL ? index + 1 : index - 1;
          if (prev >= 0 && prev < length) inputRefs.current[prev]?.focus();
        } else if (key === 'ArrowRight') {
          const next = isRTL ? index - 1 : index + 1;
          if (next >= 0 && next < length) inputRefs.current[next]?.focus();
        } else if (key === 'Home') {
          inputRefs.current[0]?.focus();
        } else if (key === 'End') {
          inputRefs.current[length - 1]?.focus();
        }
      },
      [disabled, length, isRTL]
    );

    // ── Focus / blur ──────────────────────────────────────────────────────────
    const handleFocus = useCallback(
      (index: number) => {
        setFocused(true);
        setFocusedIndex(index);
        externalOnFocus?.();

        if (animate) {
          Animated.sequence([
            Animated.timing(fadeAnimations[index], { toValue: 1.1, duration: animationDuration / 2, useNativeDriver: true }),
            Animated.timing(fadeAnimations[index], { toValue: 1, duration: animationDuration / 2, useNativeDriver: true }),
          ]).start();
        }

        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          AccessibilityInfo.announceForAccessibility(
            `OTP digit ${index + 1} of ${length}. ${localValue[index] ? `Filled with ${mask ? 'dot' : localValue[index]}` : 'Empty'}`
          );
        }
      },
      [externalOnFocus, fadeAnimations, animate, animationDuration, localValue, length, mask]
    );

    const handleBlur = useCallback(() => {
      setFocused(false);
      setFocusedIndex(-1);
      externalOnBlur?.();
      // allow clipboard checks again on next focus
      clipboardCheckedRef.current = false;
      if (animate) {
        fadeAnimations.forEach(anim =>
          Animated.timing(anim, { toValue: 1, duration: animationDuration, useNativeDriver: true }).start()
        );
      }
    }, [externalOnBlur, fadeAnimations, animate, animationDuration]);

    // ── Container press ───────────────────────────────────────────────────────
    const handleContainerPress = useCallback(() => {
      if (disabled) return;
      const firstEmpty = localValue.split('').findIndex(c => !c);
      const idx = firstEmpty === -1 ? length - 1 : firstEmpty;
      inputRefs.current[idx]?.focus();
    }, [disabled, localValue, length]);

    // ── Resend ────────────────────────────────────────────────────────────────
    const handleResend = useCallback(() => {
      if (disabled || resendCountdown > 0 || resendAttempts >= maxResendAttempts) return;
      onResend?.();
      setResendAttempts(p => p + 1);
      setResendCountdown(resendCooldown);
    }, [disabled, resendCountdown, resendAttempts, maxResendAttempts, onResend, resendCooldown]);

    // ── Imperative handle ─────────────────────────────────────────────────────
    const focusInput = useCallback(() => inputRefs.current[0]?.focus(), []);
    const blurInputs = useCallback(() => inputRefs.current.forEach(r => r?.blur()), []);
    const clearInputs = useCallback(() => {
      setLocalValue('');
      onChange('');
      inputRefs.current[0]?.focus();
    }, [onChange]);

    useEffect(() => {
      if (ref) {
        (ref as React.MutableRefObject<OTPInputRef>).current = {
          focus: focusInput,
          blur: blurInputs,
          clear: clearInputs,
        };
      }
    }, [ref, focusInput, blurInputs, clearInputs]);

    // ── Slot position ─────────────────────────────────────────────────────────
    const getPosition = useCallback(
      (index: number): 'first' | 'middle' | 'last' | 'solo' => {
        if (length === 1) return 'solo';
        const adj = isRTL ? length - 1 - index : index;

        if (separator) {
          if (adj === 0) return 'first';
          if (adj === midPoint - 1) return 'last';
          if (adj === midPoint) return 'first';
          if (adj === length - 1) return 'last';
          return 'middle';
        }

        if (adj === 0) return 'first';
        if (adj === length - 1) return 'last';
        return 'middle';
      },
      [separator, length, midPoint, isRTL]
    );

    // ── Slot state ────────────────────────────────────────────────────────────
    const getSlotState = useCallback(
      (index: number): 'default' | 'active' | 'filled' | 'error' | 'disabled' => {
        if (disabled) return 'disabled';
        if (error !== false) return 'error';
        if (index === focusedIndex) return 'active';
        if (localValue[index]) return 'filled';
        return 'default';
      },
      [disabled, error, focusedIndex, localValue]
    );

    // ── Animation style ───────────────────────────────────────────────────────
    const getAnimationStyle = useCallback(
      (index: number) => ({
        transform: [{ translateX: shakeAnimations[index] }],
        opacity: fadeAnimations[index],
      }),
      [shakeAnimations, fadeAnimations]
    );

    // ── Inline style for TextInput (non-Tailwind props) ───────────────────────
    const lineHeightBySize = { sm: 16, md: 18, lg: 22 } as const;

    const resendDisabled = resendCountdown > 0 || resendAttempts >= maxResendAttempts;

    return (
      <View
        className={cn('flex-col items-center', className)}
        testID={testID}
        accessible
        accessibilityLabel={ariaLabel}
        accessibilityHint="Ingresa tu código de verificación"
        accessibilityRole={'group' as AccessibilityRole}
        accessibilityState={{ disabled }}
        onTouchEnd={handleContainerPress}
      >
        {/* ── Slot row ── */}
        <View className="flex-row items-center justify-center">
          {Array.from({ length }).map((_, index) => {
            const displayIndex = isRTL ? length - 1 - index : index;

            return (
              <React.Fragment key={index}>
                <Pressable onPress={() => !disabled && inputRefs.current[displayIndex]?.focus()}>
                  <Animated.View style={getAnimationStyle(displayIndex)}>
                    <TextInput
                      ref={r => { inputRefs.current[displayIndex] = r; }}
                      className={slotVariants({
                        size,
                        position: getPosition(displayIndex),
                        state: getSlotState(displayIndex),
                      })}
                      value={mask && localValue[displayIndex] ? '•' : localValue[displayIndex] || ''}
                      onChangeText={text => handleChange(text, displayIndex)}
                      onKeyPress={e => handleKeyPress(e, displayIndex)}
                      onFocus={() => handleFocus(displayIndex)}
                      onBlur={handleBlur}
                      {...(Platform.OS === 'web' ? { onKeyDown: (e: any) => handleKeyDown(e, displayIndex) } : {})}
                      // intentionally omitted maxLength to allow full paste handling
                      keyboardType={keyboard}
                      editable={!disabled}
                      selectTextOnFocus
                      autoFocus={autoFocus && displayIndex === 0}
                      textContentType="oneTimeCode"
                      autoComplete="sms-otp"
                      autoCorrect={false}
                      autoCapitalize="none"
                      spellCheck={false}
                      blurOnSubmit={false}
                      style={{
                        textAlign: 'center',
                        textAlignVertical: 'center',
                        paddingTop: 0,
                        paddingBottom: 0,
                        lineHeight: lineHeightBySize[size],
                        fontWeight: '600',
                      }}
                      accessibilityLabel={`Dígito OTP ${displayIndex + 1} de ${length}${localValue[displayIndex] ? '. Completado' : '. Vacío'}`}
                      accessibilityRole="text"
                      accessibilityState={{ disabled, selected: displayIndex === focusedIndex }}
                      accessibilityHint={`Ingresa el dígito ${displayIndex + 1} de tu código de verificación`}
                      testID={`${testID}-input-${displayIndex}`}
                    />
                  </Animated.View>
                </Pressable>

                {separator && displayIndex === midPoint - 1 && (
                  <View
                    className={cn('mx-2', typeof error !== 'boolean' && error ? 'opacity-50' : '')}
                    accessibilityElementsHidden
                  >
                    {typeof separator === 'boolean' ? <Text className="text-muted-foreground">—</Text> : separator}
                  </View>
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* ── Error message ── */}
        {error !== false && (
          <Text
            className="text-destructive mt-2 w-full text-center text-sm"
            accessibilityLabel={errorAriaLabel}
            accessibilityRole="alert"
            testID={`${testID}-error`}
          >
            {typeof error === 'string' ? error : 'Invalid code'}
          </Text>
        )}

        {/* ── Expiry timer ── */}
        {showExpiryTimer && expiresIn > 0 && (
          <Text
            className="text-muted-foreground mt-2 w-full text-center text-sm"
            accessibilityLabel={`Code expires in ${timeRemaining} seconds`}
            testID={`${testID}-timer`}
          >
            Code expires in {timeRemaining}s
          </Text>
        )}

        {/* ── Resend button ── */}
        {onResend && (
          <View className={cn('mt-4 flex w-full items-center justify-center', resendDisabled && 'opacity-50')}>
            <Button
              onPress={handleResend}
              disabled={resendDisabled}
              variant="default"
              className="w-[60%]"
              accessibilityLabel={
                resendCountdown > 0
                  ? `Resend code in ${resendCountdown} seconds`
                  : resendAttempts >= maxResendAttempts
                    ? 'Maximum resend attempts reached'
                    : 'Resend code'
              }
              testID={`${testID}-resend`}
            >
              {resendCountdown > 0
                ? `Resend code in ${resendCountdown}s`
                : resendAttempts >= maxResendAttempts
                  ? 'Maximum resend attempts reached'
                  : 'Resend code'}
            </Button>
          </View>
        )}
      </View>
    );
  }
);

OTPInput.displayName = 'OTPInput';

export type { OTPInputRef };

