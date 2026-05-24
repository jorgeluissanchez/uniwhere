import { LAYERED_WAVES_SVG } from "@/assets/svgs/layeredWaves";
import { STUDENTS_RAFIKI_SVG } from "@/assets/svgs/studentsRafiki";
import { Button } from "@/core/components/ui/button";
import { Text } from "@/core/components/ui/text";
import { SignupForm } from "@/features/auth/presentation/components/signup-form";
import { RelativePathString, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import { Dimensions, View } from "react-native";
import { SvgXml } from "react-native-svg";

export default function SignupScreen() {
  const router = useRouter();
  const { width } = Dimensions.get("window");

  return (
    <View className="flex-1 bg-white">
      {/* Illustration */}
      <View className="w-full items-center bg-blue-50 overflow-hidden" style={{ height: 280 }}>
        <SvgXml xml={STUDENTS_RAFIKI_SVG} width={width * 1.18} height={280 * 1.18} preserveAspectRatio="xMidYMid meet" />
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
          Por favor regístrese
        </Text>
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
