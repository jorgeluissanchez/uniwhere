import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Text } from "@/core/components/ui/text";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Keyboard, View } from "react-native";

interface FormErrors {
  email?: string;
  password?: string;
}

export function LoginForm() {
  const { login, error, clearError } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) newErrors.email = "Ingresa tu correo";
    else if (!trimmedEmail.includes("@")) newErrors.email = "Ingresa un correo válido";

    if (!password) newErrors.password = "Ingresa tu contraseña";
    else if (password.length < 6) newErrors.password = "Mínimo 6 caracteres";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!validate()) return;

    try {
      setLoading(true);
      await login(email.trim(), password);
    } finally {
      setLoading(false);
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
          testID="email-input"
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
          onSubmitEditing={handleSubmit}
          className={errors.email ? "border-2 border-destructive" : undefined}
        />
        {!!errors.email && (
          <Text className="mt-1 px-1 text-xs text-destructive">{errors.email}</Text>
        )}
      </View>

      <View>
        <Input
          testID="password-input"
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
            if (error) clearError();
          }}
          placeholder="Contraseña"
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          className={errors.password ? "border-2 border-destructive" : undefined}
        />
        {!!errors.password && (
          <Text className="mt-1 px-1 text-xs text-destructive">{errors.password}</Text>
        )}
      </View>

      <Button testID="login-button" onPress={handleSubmit} disabled={loading} className="mt-2 w-full">
        <Text>{loading ? "Iniciando sesión..." : "INICIAR SESIÓN"}</Text>
      </Button>
    </View>
  );
}
