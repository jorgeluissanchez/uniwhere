import { STUDENTS_RAFIKI_SVG } from "@/assets/svgs/studentsRafiki";
import { Button } from "@/core/components/ui/button";
import { Icon } from "@/core/components/ui/icon";
import { Text } from "@/core/components/ui/text";
import { LoginForm } from "@/features/auth/presentation/components/login-form";
import { RelativePathString, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import { Dimensions, ScrollView, View } from "react-native";
import { SvgXml } from "react-native-svg";

export default function LoginScreen() {
  const router = useRouter();
  const { width } = Dimensions.get("window");

  return (
    <View className="flex-1 bg-background">
      {/* Ver la nota de SignupScreen: la pantalla scrollea para no recortar el
          formulario en alto reducido. */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Illustration */}
        <View className="w-full items-center bg-primary/10 overflow-hidden" style={{ height: 280 }}>
          <SvgXml xml={STUDENTS_RAFIKI_SVG} width={width * 1.18} height={280 * 1.18} preserveAspectRatio="xMidYMid meet" />
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
      </ScrollView>

      {/* Back button overlaid on illustration — fijo sobre el scroll. */}
      <View className="absolute top-10 left-6">
        <Button
          variant="ghost"
          size="icon"
          onPress={() => router.replace("/landing")}
          className="w-12 h-12 bg-primary/10"
        >
          <Icon as={ArrowLeft} size={20} className="text-primary" />
        </Button>
      </View>
    </View>
  );
}
