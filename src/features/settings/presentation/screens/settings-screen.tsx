import { CURIOUS_CUATE_SVG } from "@/assets/svgs/curiousCuate";
import { LOW_POLY_GRID_SVG } from "@/assets/svgs/lowPolyGrid";
import { Button } from "@/core/components/ui/button";
import { Text } from "@/core/components/ui/text";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { RelativePathString, useRouter } from "expo-router";
import { LogOutIcon, XIcon } from "lucide-react-native";
import React from "react";
import { Dimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SvgXml } from "react-native-svg";

function capitalizeLikeWelcome(name: string): string {
  return name
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function SettingsScreen() {
  const { loggedUser, logout } = useAuth();
  const router = useRouter();
  const { width, height } = Dimensions.get("window");

  const isAdmin = loggedUser?.role === "admin";
  const greeting = isAdmin ? "Panel de Administrador" : "Mi Perfil";
  const displayName = capitalizeLikeWelcome(
    loggedUser?.name ?? loggedUser?.email?.split("@")[0] ?? "Usuario"
  );

  return (
    <View className="flex-1">
      {/* Top half — blue with poly grid */}
      <View className="flex-1 bg-blue-900 overflow-hidden justify-between">
        <View pointerEvents="none" className="absolute inset-0" style={{ opacity: 0.35 }}>
          <SvgXml xml={LOW_POLY_GRID_SVG} width={width} height={height} preserveAspectRatio="xMidYMid slice" />
        </View>

        <View className="px-5 pt-10">
          <View className="flex-row items-center justify-between">
            <Button
              variant="ghost"
              onPress={() => router.replace("/" as RelativePathString)}
              className="rounded-full w-12 h-12 items-center justify-center bg-blue-800"
            >
              <XIcon size={20} color="white" />
            </Button>

            <Text variant="h3" className="flex-1 text-center text-white font-cal text-lg">
              {greeting}
            </Text>

            <Button
              variant="ghost"
              onPress={async () => { await logout(); }}
              className="rounded-full w-12 h-12 items-center justify-center bg-blue-800"
            >
              <LogOutIcon size={20} color="white" />
            </Button>
          </View>
        </View>

        <View className="w-full items-center justify-center max-w-lg mx-auto px-4 pb-8">
          <Text variant="h1" className="text-white text-center leading-tight">
            {displayName}
          </Text>
          <Text className="mt-3 text-blue-200">
            {loggedUser?.email ?? ""}
          </Text>
          <View className="mt-4 bg-blue-700 rounded-2xl px-6 py-3">
            <Text className="text-blue-100 text-center text-sm">
              {isAdmin ? "Administrador" : "Usuario"}
            </Text>
          </View>
        </View>

      </View>

      {/* Bottom half — gray with illustration */}
      <View className="flex-1 bg-gray-100 items-center justify-center overflow-hidden">
        {/* Fade azul sobre gris en el borde superior */}
        <LinearGradient
          colors={["rgba(30,58,138,0.45)", "rgba(30,58,138,0.05)"]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120 }}
          pointerEvents="none"
        />
        <SvgXml xml={CURIOUS_CUATE_SVG} width={width * 1.1} height={width * 1.1} />
      </View>
    </View>
  );
}
