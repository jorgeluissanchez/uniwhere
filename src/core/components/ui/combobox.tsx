/**
 * Combobox — React Native
 * Inspired by shadcn/ui's compositional pattern.
 *
 * Usage:
 *   <Combobox value={value} onValueChange={setValue}>
 *     <ComboboxInput placeholder="Search..." />
 *     <ComboboxContent>
 *       <ComboboxList>
 *         <ComboboxEmpty>No results.</ComboboxEmpty>
 *         {options.map(o => (
 *           <ComboboxItem key={o.value} value={o.value} label={o.label} />
 *         ))}
 *       </ComboboxList>
 *     </ComboboxContent>
 *   </Combobox>
 */

import { cn } from "@/core/lib/utils";
import { Check, ChevronDown, X } from "lucide-react-native";
import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  type TextInputProps,
  type ViewProps,
} from "react-native";
import { Text } from "./text";

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

type ComboboxContextValue = {
  // controlled value (the id/key that gets stored)
  value: string | undefined;
  // display text in the input
  inputValue: string;
  setInputValue: (v: string) => void;
  // whether dropdown is open
  open: boolean;
  setOpen: (v: boolean) => void;
  // called when user picks an item
  commitSelection: (value: string, label: string) => void;
  // called when user clears
  clearSelection: () => void;
  // fired from onPressIn so blur-timeout can detect a pending selection
  justSelectedRef: React.MutableRefObject<boolean>;
  // whether input has an error border
  hasError?: boolean;
};

const ComboboxContext = createContext<ComboboxContextValue | null>(null);

function useCombobox() {
  const ctx = useContext(ComboboxContext);
  if (!ctx) throw new Error("Combobox sub-component used outside <Combobox>");
  return ctx;
}

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────

type ComboboxProps = {
  value: string | undefined;
  onValueChange: (value: string | undefined) => void;
  hasError?: boolean;
  children: React.ReactNode;
  displayValue?: string;
};

function Combobox({ value, onValueChange, hasError, children, displayValue }: ComboboxProps) {
  const [inputValue, setInputValue] = useState(displayValue ?? "");
  const [open, setOpen] = useState(false);
  const justSelectedRef = useRef(false);

  // When an item is picked
  const commitSelection = useCallback(
    (newValue: string, label: string) => {
      onValueChange(newValue);
      setInputValue(label);
      setOpen(false);
      Keyboard.dismiss();
    },
    [onValueChange]
  );

  // X button
  const clearSelection = useCallback(() => {
    onValueChange(undefined);
    setInputValue("");
    setOpen(false);
  }, [onValueChange]);

  return (
    <ComboboxContext.Provider
      value={{
        value,
        inputValue,
        setInputValue,
        open,
        setOpen,
        commitSelection,
        clearSelection,
        justSelectedRef,
        hasError,
      }}
    >
      <View style={{ position: "relative", zIndex: 10, width: "100%" }}>{children}</View>
    </ComboboxContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Input row  (TextInput + chevron / clear button)
// ─────────────────────────────────────────────────────────────────────────────

type ComboboxInputProps = Omit<TextInputProps, "value" | "onChangeText"> & {
  filterFn?: (query: string) => void; // optional external filter callback
};

function ComboboxInput({ filterFn, placeholder = "Buscar...", style, ...props }: ComboboxInputProps) {
  const { value, inputValue, setInputValue, open, setOpen, clearSelection, justSelectedRef, hasError } =
    useCombobox();

  const handleChangeText = (v: string) => {
    justSelectedRef.current = false;
    setInputValue(v);
    setOpen(true);
    filterFn?.(v);
  };

  const handleFocus = () => setOpen(true);

  const handleBlur = () => {
    setTimeout(() => {
      if (justSelectedRef.current) {
        justSelectedRef.current = false;
        return;
      }
      // No selection was committed — restore last valid label or clear
      setOpen(false);
      if (!value) {
        setInputValue("");
      }
      // if value exists, the inputValue was already set to the label by commitSelection
    }, 150);
  };

  return (
    <View style={{ position: "relative" }}>
      <TextInput
        value={inputValue}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor={Platform.OS === "web" ? undefined : "#00000080"}
        className={cn(
          "bg-muted text-foreground h-14 w-full rounded-2xl px-4 text-base leading-5",
          Platform.select({
            web: "placeholder:text-muted-foreground outline-none transition-[color,box-shadow] focus-visible:ring-primary/50 focus-visible:ring-[3px]",
            native: "placeholder:text-muted-foreground/50",
          }),
          hasError && "border border-destructive"
        )}
        style={[{ paddingRight: 48 }, style]}
        {...props}
      />
      {/* Right icon: X when value selected, chevron otherwise */}
      <View
        style={{
          position: "absolute",
          right: 14,
          top: 0,
          bottom: 0,
          justifyContent: "center",
          alignItems: "center",
        }}
        pointerEvents="box-none"
      >
        {value ? (
          <Pressable
            onPress={clearSelection}
            hitSlop={8}
            style={{ padding: 4 }}
          >
            <X size={16} color="#6b7280" />
          </Pressable>
        ) : (
          <ChevronDown
            size={16}
            color="#6b7280"
            style={[open ? { transform: [{ rotate: "180deg" }] } : undefined]}
          />
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Content  (the dropdown card)
// ─────────────────────────────────────────────────────────────────────────────

function ComboboxContent({ children, style, ...props }: ViewProps) {
  const { open } = useCombobox();
  if (!open) return null;

  return (
    <View
      style={[
        {
          position: "absolute",
          top: 62,
          left: 0,
          right: 0,
          backgroundColor: "#fff",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          zIndex: 999,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 10,
          overflow: "hidden",
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// List
// ─────────────────────────────────────────────────────────────────────────────

function ComboboxList({ children, style, ...props }: ViewProps) {
  return (
    <ScrollView
      keyboardShouldPersistTaps="always"
      style={[{ maxHeight: 220 }, style]}
      {...(props as any)}
    >
      {children}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Item
// ─────────────────────────────────────────────────────────────────────────────

type ComboboxItemProps = {
  value: string;
  label: string;
  /** Whether this item matches the current filter — pass false to hide */
  visible?: boolean;
};

function ComboboxItem({ value: itemValue, label, visible = true }: ComboboxItemProps) {
  const { value: selectedValue, commitSelection, justSelectedRef } = useCombobox();
  const isSelected = selectedValue === itemValue;

  if (!visible) return null;

  return (
    <Pressable
      onPressIn={() => {
        // Mark BEFORE blur fires so the blur-timeout won't clear the field
        justSelectedRef.current = true;
      }}
      onPress={() => commitSelection(itemValue, label)}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: pressed ? "#EEF2FF" : isSelected ? "#F0F4FF" : "#fff",
      })}
    >
      <Text style={{ fontSize: 15, color: isSelected ? "#4F46E5" : "#111827", flex: 1 }}>
        {label}
      </Text>
      {isSelected && <Check size={16} color="#4F46E5" />}
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty
// ─────────────────────────────────────────────────────────────────────────────

type ComboboxEmptyProps = { children?: React.ReactNode; shown?: boolean };

function ComboboxEmpty({ children = "Sin resultados.", shown = true }: ComboboxEmptyProps) {
  if (!shown) return null;
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
      <Text style={{ fontSize: 14, color: "#9ca3af", textAlign: "center" }}>{children}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Separator
// ─────────────────────────────────────────────────────────────────────────────

function ComboboxSeparator() {
  return <View style={{ height: 1, backgroundColor: "#f3f4f6", marginHorizontal: 12 }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

export {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator
};

