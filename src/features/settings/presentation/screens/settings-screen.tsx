import { SETTINGS_BG_BOTTOM_SVG } from "@/assets/svgs/settingsBgBottom";
import { SETTINGS_BG_MEN_SVG } from "@/assets/svgs/settingsBgMen";
import { SETTINGS_BG_MIDDLE_SVG } from "@/assets/svgs/settingsBgMiddle";
import { SETTINGS_BG_TOP_SVG } from "@/assets/svgs/settingsBgTop";
import { Button } from "@/core/components/ui/button";
import { Text } from "@/core/components/ui/text";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { RelativePathString, useRouter } from "expo-router";
import { LogOutIcon, XIcon } from "lucide-react-native";
import React from "react";
import { View } from "react-native";
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

  const isAdmin = loggedUser?.role === "admin";
  const greeting = isAdmin ? "Panel de Administrador" : "Mi Perfil";
  const displayName = capitalizeLikeWelcome(
    loggedUser?.name ?? loggedUser?.email?.split("@")[0] ?? "Usuario"
  );

  return (
    <View className="flex-1 overflow-hidden bg-blue-900">
      <View pointerEvents="none" className="absolute inset-0">
        <View className="absolute top-0 right-0">
          <SvgXml xml={SETTINGS_BG_TOP_SVG} width={200} height={300} />
        </View>
        <View className="absolute top-[250px] left-1/2 -ml-[263px]">
          <SvgXml xml={SETTINGS_BG_MIDDLE_SVG} width={527} height={477} />
        </View>
        <View className="absolute bottom-0 left-0">
          <SvgXml xml={SETTINGS_BG_BOTTOM_SVG} width={500} height={150} />
        </View>
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

      <View className="my-auto w-full items-center justify-center max-w-lg mx-auto px-4">
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

      <View className="items-center">
        <SvgXml xml={SETTINGS_BG_MEN_SVG} width={250} height={375} />
      </View>
    </View>
  );
}
