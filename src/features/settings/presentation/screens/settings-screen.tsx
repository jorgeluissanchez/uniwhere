import { CURIOUS_CUATE_SVG } from "@/assets/svgs/curiousCuate";
import { LOW_POLY_GRID_SVG } from "@/assets/svgs/lowPolyGrid";
import { Button } from "@/core/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Text } from "@/core/components/ui/text";
import { ToggleGroup, ToggleGroupItem } from "@/core/components/ui/toggle-group";
import { useAppTheme } from "@/core/hooks/use-app-theme";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { RelativePathString, useRouter } from "expo-router";
import { LogOutIcon, XIcon } from "lucide-react-native";
import React from "react";
import { Dimensions, View } from "react-native";
import { SvgXml } from "react-native-svg";
import { LinearGradient } from 'expo-linear-gradient';

function capitalizeLikeWelcome(name: string): string {
  return name.toLowerCase().split(" ").filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default function SettingsScreen() {
  const { loggedUser, logout } = useAuth();
  const { tokens, schemeOverride, colorTheme, setSchemeOverride, setColorTheme } = useAppTheme();
  const router = useRouter();
  const { width } = Dimensions.get("window");

  const isAdmin = loggedUser?.role === "admin";
  const greeting = isAdmin ? "Panel de Administrador" : "Mi Perfil";
  const displayName = capitalizeLikeWelcome(
    loggedUser?.name ?? loggedUser?.email?.split("@")[0] ?? "Usuario"
  );
  const bgColor = `hsl(${tokens.background})`;

  return (
    <View className="flex-1">
      {/* Top half — primary gradient with poly grid */}
      <View className="flex-1 bg-primary overflow-hidden justify-between">
        <View pointerEvents="none" className="absolute inset-0" style={{ opacity: 0.35 }}>
          <SvgXml xml={LOW_POLY_GRID_SVG} width={width} height={width * 1.5} preserveAspectRatio="xMidYMid slice" />
        </View>

        <View className="px-5 pt-10">
          <View className="flex-row items-center justify-between">
            <Button
              variant="ghost"
              onPress={() => router.replace("/" as RelativePathString)}
              className="rounded-full w-12 h-12 items-center justify-center bg-primary/80"
            >
              <XIcon size={20} color="white" />
            </Button>
            <Text variant="h3" className="flex-1 text-center text-primary-foreground font-cal text-lg">
              {greeting}
            </Text>
            <Button
              variant="ghost"
              onPress={async () => { await logout(); }}
              className="rounded-full w-12 h-12 items-center justify-center bg-primary/80"
            >
              <LogOutIcon size={20} color="white" />
            </Button>
          </View>
        </View>

        <View className="w-full items-center justify-center max-w-lg mx-auto px-4 pb-8">
          <Text variant="h1" className="text-primary-foreground text-center leading-tight">
            {displayName}
          </Text>
          <Text className="mt-3 text-primary-foreground/70">
            {loggedUser?.email ?? ""}
          </Text>
          <View className="mt-4 bg-primary/70 rounded-2xl px-6 py-3">
            <Text className="text-primary-foreground/80 text-center text-sm">
              {isAdmin ? "Administrador" : "Usuario"}
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom half — background with illustration + Appearance card */}
      <View className="flex-1 bg-background items-center justify-between overflow-hidden px-5 pt-4 pb-6">
        {/* Appearance card */}
        <Card className="w-full" testID="appearance-card">
          <CardHeader className="pb-2">
            <CardTitle>Apariencia</CardTitle>
          </CardHeader>
          <CardContent className="gap-4">
            {/* Mode control */}
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Modo
              </Text>
              <ToggleGroup
                type="single"
                value={schemeOverride}
                onValueChange={(v) => v && setSchemeOverride(v as 'light' | 'dark' | 'system')}
                variant="outline"
                className="w-full"
              >
                <ToggleGroupItem value="light" className="flex-1" testID="mode-toggle-light">
                  <Text className="text-xs">☀ Claro</Text>
                </ToggleGroupItem>
                <ToggleGroupItem value="dark" className="flex-1" testID="mode-toggle-dark">
                  <Text className="text-xs">🌙 Oscuro</Text>
                </ToggleGroupItem>
                <ToggleGroupItem value="system" className="flex-1" testID="mode-toggle-system">
                  <Text className="text-xs">Auto</Text>
                </ToggleGroupItem>
              </ToggleGroup>
            </View>

            {/* Theme control */}
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Tema de color
              </Text>
              <ToggleGroup
                type="single"
                value={colorTheme}
                onValueChange={(v) => v && setColorTheme(v as 'indigo' | 'teal')}
                variant="outline"
                className="w-full"
              >
                <ToggleGroupItem value="indigo" className="flex-1" testID="theme-toggle-indigo">
                  <View className="flex-row items-center gap-1.5">
                    <View className="w-3 h-3 rounded-full bg-[hsl(239,84%,67%)]" />
                    <Text className="text-xs">Índigo</Text>
                  </View>
                </ToggleGroupItem>
                <ToggleGroupItem value="teal" className="flex-1" testID="theme-toggle-teal">
                  <View className="flex-row items-center gap-1.5">
                    <View className="w-3 h-3 rounded-full bg-[hsl(199,89%,48%)]" />
                    <Text className="text-xs">Teal</Text>
                  </View>
                </ToggleGroupItem>
              </ToggleGroup>
            </View>
          </CardContent>
        </Card>

        {/* Illustration */}
        <View className="flex-1 w-full items-center justify-center overflow-hidden">
          <SvgXml xml={CURIOUS_CUATE_SVG} width={width * 1.1} height={width * 1.1} />
          <LinearGradient
            colors={[bgColor, 'transparent']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80 }}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['transparent', bgColor]}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 }}
            pointerEvents="none"
          />
        </View>
      </View>
    </View>
  );
}
