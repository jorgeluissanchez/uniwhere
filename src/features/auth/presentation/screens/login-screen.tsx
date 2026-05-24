import { STUDENTS_RAFIKI_SVG } from "@/assets/svgs/studentsRafiki";
import { Button } from "@/core/components/ui/button";
import { Text } from "@/core/components/ui/text";
import { LoginForm } from "@/features/auth/presentation/components/login-form";
import { RelativePathString, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import { Dimensions, View } from "react-native";
import { SvgXml } from "react-native-svg";

export default function LoginScreen() {
  const router = useRouter();
  const { width } = Dimensions.get("window");

  return (
    <View className="flex-1 bg-white">
      {/* Illustration */}
      <View className="w-full items-center bg-blue-50">
        <SvgXml xml={STUDENTS_RAFIKI_SVG} width={width} height={220} preserveAspectRatio="xMidYMid meet" />
      </View>

      {/* Back button overlaid on illustration */}
      <View className="absolute top-10 left-6">
        <Button
          onPress={() => router.replace("/landing")}
          className="rounded-full w-[50px] h-[50px] p-6 bg-blue-100"
        >
          <ArrowLeft color="#1D4ED8" height={20} width={20} />
        </Button>
      </View>

      {/* Content */}
      <View className="flex-1 px-6 pt-6 w-full max-w-lg mx-auto">
        <Text variant="h2" className="text-center mb-6">
          Bienvenido de nuevo
        </Text>
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
