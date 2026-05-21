import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Text } from "@/core/components/ui/text";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { RelativePathString, useRouter } from "expo-router";
import React, { useState } from "react";
import { Keyboard, View } from "react-native";

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function SignupForm() {
  const { signup, error, clearError } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) newErrors.name = "Ingresa tu nombre";

    const trimmedEmail = email.trim();
    if (!trimmedEmail) newErrors.email = "Ingresa tu correo";
    else if (!trimmedEmail.includes("@")) newErrors.email = "Ingresa un correo válido";

    if (!password) newErrors.password = "Ingresa tu contraseña";
    else if (password.length < 6) newErrors.password = "Mínimo 6 caracteres";

    if (!confirmPassword) newErrors.confirmPassword = "Confirma tu contraseña";
    else if (password !== confirmPassword) newErrors.confirmPassword = "Las contraseñas no coinciden";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!validate()) return;

    setLoading(true);
    const created = await signup(email.trim(), password, name.trim(), "user").finally(
      () => setLoading(false)
    );

    if (created) {
      router.replace("/" as RelativePathString);
    }
  };

  return (
    <View className="gap-3">
      {!!error && (
        <View className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
          <Text className="text-sm text-destructive">{error}</Text>
        </View>
      )}

      <View>
        <Input
          testID="signup-name-input"
          value={name}
          onChangeText={(v) => {
            setName(v);
            if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
            if (error) clearError();
          }}
          placeholder="Nombre"
          autoCapitalize="words"
          returnKeyType="next"
          className={errors.name ? "border-2 border-destructive" : undefined}
        />
        {!!errors.name && (
          <Text className="mt-1 px-1 text-xs text-destructive">{errors.name}</Text>
        )}
      </View>

      <View>
        <Input
          testID="signup-email-input"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
            if (error) clearError();
          }}
          placeholder="Correo"
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="next"
          className={errors.email ? "border-2 border-destructive" : undefined}
        />
        {!!errors.email && (
          <Text className="mt-1 px-1 text-xs text-destructive">{errors.email}</Text>
        )}
      </View>

      <View>
        <Input
          testID="signup-password-input"
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
            if (error) clearError();
          }}
          placeholder="Contraseña"
          secureTextEntry
          returnKeyType="next"
          className={errors.password ? "border-2 border-destructive" : undefined}
        />
        {!!errors.password && (
          <Text className="mt-1 px-1 text-xs text-destructive">{errors.password}</Text>
        )}
      </View>

      <View>
        <Input
          testID="signup-confirm-password-input"
          value={confirmPassword}
          onChangeText={(v) => {
            setConfirmPassword(v);
            if (errors.confirmPassword) setErrors((e) => ({ ...e, confirmPassword: undefined }));
          }}
          placeholder="Confirmar Contraseña"
          secureTextEntry
          returnKeyType="next"
          className={errors.confirmPassword ? "border-2 border-destructive" : undefined}
        />
        {!!errors.confirmPassword && (
          <Text className="mt-1 px-1 text-xs text-destructive">{errors.confirmPassword}</Text>
        )}
      </View>

      <Button
        testID="signup-button"
        onPress={handleSubmit}
        disabled={loading}
        className="mt-2 w-full"
      >
        <Text>{loading ? "Creando cuenta..." : "REGISTRARSE"}</Text>
      </Button>
    </View>
  );
}
