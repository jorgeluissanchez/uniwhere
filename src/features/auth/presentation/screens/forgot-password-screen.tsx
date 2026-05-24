import { BLOB_SVG } from "@/assets/svgs/blob";
import { Button } from "@/core/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Text } from "@/core/components/ui/text";
import { ForgotPasswordForm } from "@/features/auth/presentation/components/forgot-password-form";
import type { RelativePathString } from "expo-router";
import { useRouter } from "expo-router";
import React from "react";
import { Dimensions, View } from "react-native";
import { SvgXml } from "react-native-svg";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { width, height } = Dimensions.get("window");
  return (
    <View className="flex-1 justify-center p-5 overflow-hidden">
      <View pointerEvents="none" className="absolute inset-0">
        <SvgXml xml={BLOB_SVG} width={width} height={height} preserveAspectRatio="xMidYMid slice" />
      </View>
      <Card className="max-w-xl mx-auto w-full">
        <CardHeader>
          <CardTitle className="text-center">¿Olvidaste tu contraseña?</CardTitle>
          <CardDescription className="text-center">Ingresa tu correo para restablecer tu contraseña</CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
          
        <Button variant="link" onPress={() => router.replace('/login' as RelativePathString)}>
          <Text>Volver al inicio de sesión</Text>
        </Button>
        </CardContent>
      </Card>
    </View>
  );
}

