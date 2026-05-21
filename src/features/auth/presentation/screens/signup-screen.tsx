import { LOGIN_SVG } from "@/assets/svgs/login";
import { Button } from "@/core/components/ui/button";
import { Text } from "@/core/components/ui/text";
import { SignupForm } from "@/features/auth/presentation/components/signup-form";
import { RelativePathString, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import { View } from "react-native";
import { SvgXml } from "react-native-svg";

export default function SignupScreen() {
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
            Por favor regístrese
          </Text>
          <View className="h-10 w-10" />
        </View>
        <SignupForm />
        <Button
          testID="create-account-button"
          className="px-6 items-center mt-4"
          variant="link"
          onPress={() => router.push("/login" as RelativePathString)}
        >
          <Text>¿tienes una cuenta? Inicia sesión</Text>
        </Button>
      </View>
    </View>
  );
}
