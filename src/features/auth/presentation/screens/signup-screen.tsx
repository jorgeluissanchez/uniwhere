import { LAYERED_WAVES_SVG } from "@/assets/svgs/layeredWaves";
import { STUDENTS_RAFIKI_SVG } from "@/assets/svgs/studentsRafiki";
import { Button } from "@/core/components/ui/button";
import { Icon } from "@/core/components/ui/icon";
import { Text } from "@/core/components/ui/text";
import { SignupForm } from "@/features/auth/presentation/components/signup-form";
import { RelativePathString, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import { Dimensions, ScrollView, View } from "react-native";
import { SvgXml } from "react-native-svg";

export default function SignupScreen() {
  const router = useRouter();
  const { width } = Dimensions.get("window");

  return (
    <View className="flex-1 bg-background">
      {/* El formulario no cabe en pantallas cortas (ni con el teclado abierto),
          así que la pantalla scrollea; `flexGrow` mantiene el contenido
          estirado cuando sí sobra alto. */}
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
      </ScrollView>

      {/* Back button overlaid on illustration — fuera del ScrollView para que
          quede fijo mientras el contenido se desplaza. */}
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
