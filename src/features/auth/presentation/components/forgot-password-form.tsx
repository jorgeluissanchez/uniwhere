import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Text } from "@/core/components/ui/text";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import React, { useState } from "react";
import { Keyboard, View } from "react-native";

export function ForgotPasswordForm() {
  const { forgotPassword, error, clearError } = useAuth();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validate = (): boolean => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("Ingresa tu correo");
      return false;
    }
    if (!trimmed.includes("@")) {
      setEmailError("Ingresa un correo válido");
      return false;
    }
    setEmailError(undefined);
    return true;
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!validate()) return;

    setLoading(true);
    await forgotPassword(email.trim()).finally(() => setLoading(false));

    if (!error) setSuccessMessage(`Se envió un enlace para restablecer la contraseña a ${email.trim()}`);
  };

  return (
    <View className="gap-4">
      {!!successMessage && (
          <View className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2">
            <Text className="text-sm text-foreground">{successMessage}</Text>
          </View>
        )}
        {!!error && (
          <View className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
            <Text className="text-sm text-destructive">{error}</Text>
          </View>
        )}

        <View className="gap-1.5">
          <Label>Correo electrónico</Label>
          <Input
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (emailError) setEmailError(undefined);
              if (error) clearError();
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            className={emailError ? "border-destructive" : undefined}
          />
          {!!emailError && <Text className="text-sm text-destructive">{emailError}</Text>}
        </View>

        <Button onPress={handleSubmit} disabled={loading}>
          <Text>{loading ? "Enviando..." : "Enviar enlace de restablecimiento"}</Text>
        </Button>
    </View>
  );
}
