import { Button } from "@/core/components/ui/button";
import { Text } from "@/core/components/ui/text";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { RelativePathString, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";
import { UNDRAW_RIGHT_DIRECTION_SVG } from "../../../assets/svgs/undrawRightDirection";

export default function StudentWelcomeScreen() {
  const router = useRouter();

  const { loggedUser } = useAuth();

  const { width, height } = useWindowDimensions();

  const insets = useSafeAreaInsets();

  // La ilustración es lo único elástico del layout: el título, el subtítulo y el
  // botón tienen alto fijo, así que la acotamos también por la altura de la
  // ventana para que nada se salga de pantalla en viewports bajos.
  const illustrationSize = Math.max(
    140,
    Math.min(width < 400 ? width - 80 : 350, height * 0.34)
  );

  const isAdmin = loggedUser?.role === "admin";

  const userName = useMemo(() => {
    if (!loggedUser?.name) return "Usuario";

    return loggedUser.name.split(" ")[0];
  }, [loggedUser]);

  return (
    <View className="flex-1 bg-primary overflow-hidden">

      <View
        className="flex-1 w-full max-w-lg self-center px-6 justify-between"
        style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
      >
        <Text className="text-lg text-center text-primary-foreground font-bold">UniWhere</Text>

        <View className="flex-1 shrink items-center justify-center">
          <Text variant="h1" className="text-primary-foreground/80 text-center">
            {`Hola ${userName}, ${isAdmin ? "gestiona los espacios" : "explora los espacios universitarios"}`
              .toLowerCase()
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}
          </Text>

          <Text className="text-primary-foreground/70 text-center mt-4 text-[16px] leading-7 italic">
            {isAdmin
              ? "Administra y organiza los espacios de la universidad."
              : "Escanea y descubre los espacios universitarios a través de fotos."}
          </Text>

          <View className="mt-6 shrink items-center justify-center" style={{ transform: [{ translateX: 30 }] }}>
            <SvgXml
              xml={UNDRAW_RIGHT_DIRECTION_SVG}
              width={illustrationSize}
              height={illustrationSize}
            />
          </View>
        </View>

        <Button
          variant="secondary"
          className="h-16 mt-6 shrink-0 rounded-full w-full"
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
