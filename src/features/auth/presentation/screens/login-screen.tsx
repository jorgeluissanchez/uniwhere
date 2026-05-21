import { LOGIN_SVG } from "@/assets/svgs/login";
import { Button } from "@/core/components/ui/button";
import { Text } from "@/core/components/ui/text";
import { LoginForm } from "@/features/auth/presentation/components/login-form";
import { RelativePathString, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import { View } from "react-native";
import { SvgXml } from "react-native-svg";

export default function LoginScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white overflow-hidden">
      <View pointerEvents="none" className="absolute inset-0">
        <SvgXml xml={LOGIN_SVG} width={500} height={300} className="absolute -top-16 left-1/2 -ml-[250px] -z-10" />
      </View>
      <View className="px-6 w-full max-w-lg mx-auto">
        <View className="flex-row justify-between items-center py-20">
          <Button
            onPress={() => router.replace("/landing")}
            className="rounded-full w-[50px] h-[50px] p-6 bg-blue-100"
          >
            <ArrowLeft color="#1D4ED8" height={20} width={20} />
          </Button>
          <Text variant="h2" className="text-center">
            Bienvenido de nuevo
          </Text>
          <View className="h-10 w-10" />
        </View>
        <LoginForm />

        <Button
          testID="create-account-button"
          className="px-6 items-center my-4"
          variant="link"
          onPress={() => router.push("/signup" as RelativePathString)}
        >
          <Text>¿No tienes una cuenta? Regístrate</Text>
        </Button>
      </View>
    </View>
  );
}
