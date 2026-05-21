import { Button } from "@/core/components/ui/button";
import { Text } from "@/core/components/ui/text";

import { useAuth } from "@/features/auth/presentation/context/auth-context";

import { RelativePathString, useRouter } from "expo-router";

import React, { useMemo } from "react";

import { Dimensions, View } from "react-native";

import { SvgXml } from "react-native-svg";

import { WELCOME_SVG } from "../../../assets/svgs/welcome";

export default function StudentWelcomeScreen() {
  const router = useRouter();

  const { loggedUser } = useAuth();

  const { width } = Dimensions.get("window");

  const isAdmin = loggedUser?.role === "admin";

  const userName = useMemo(() => {
    if (!loggedUser?.name) return "Usuario";

    return loggedUser.name.split(" ")[0];
  }, [loggedUser]);

  return (
    <View className="flex-1 bg-blue-500">
      <View className="flex-1 w-full max-w-lg self-center px-6 pt-10 pb-8 justify-between">
        <Text className="text-lg text-center text-white font-bold">UniWhere</Text>

        <View className="items-center">
          <Text variant="h1" className="text-blue-100 text-center">
            {`Hola ${userName}, ${isAdmin ? "gestiona los espacios" : "explora los espacios universitarios"}`
              .toLowerCase()
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}
          </Text>

          <Text className="text-blue-200 text-center mt-6 text-[16px] leading-7 italic">
            {isAdmin
              ? "Administra y organiza los espacios de la universidad."
              : "Escanea y descubre los espacios universitarios a través de fotos."}
          </Text>

          <View className="mt-8 items-center justify-center">
            <SvgXml xml={WELCOME_SVG} width={width < 400 ? width - 80 : 350} height={width < 400 ? width - 80 : 350} />
          </View>
        </View>

        <Button
          variant="ghost"
          className="h-16 mb-8 rounded-full w-full bg-white"
          onPress={() =>
            router.replace("/scan" as RelativePathString)
          }
        >
          <Text>
            COMIENZA YA
          </Text>
        </Button>
      </View>
    </View>
  );
}
