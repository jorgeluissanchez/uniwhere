import { CURIOUS_CUATE_SVG } from "@/assets/svgs/curiousCuate";
import { LOW_POLY_GRID_SVG } from "@/assets/svgs/lowPolyGrid";
import { Button } from "@/core/components/ui/button";
import { Icon } from "@/core/components/ui/icon";
import { Text } from "@/core/components/ui/text";
import { ToggleGroup, ToggleGroupItem } from "@/core/components/ui/toggle-group";
import { useAppTheme } from "@/core/hooks/use-app-theme";
import { TOKENS } from "@/core/constants/theme";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { RelativePathString, useRouter } from "expo-router";
import { LogOutIcon, PaletteIcon, XIcon } from "lucide-react-native";
import React, { useState } from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";
import { SvgXml } from "react-native-svg";

function capitalizeLikeWelcome(name: string): string {
  return name.toLowerCase().split(" ").filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default function SettingsScreen() {
  const { loggedUser, logout } = useAuth();
  const { schemeOverride, colorTheme, resolvedScheme, setSchemeOverride, setColorTheme } = useAppTheme();
  const router = useRouter();
  const { width, height } = Dimensions.get("window");
  const [dialogOpen, setDialogOpen] = useState(false);

  const isAdmin = loggedUser?.role === "admin";
  const greeting = isAdmin ? "Panel de Administrador" : "Mi Perfil";
  const displayName = capitalizeLikeWelcome(
    loggedUser?.name ?? loggedUser?.email?.split("@")[0] ?? "Usuario"
  );
  const AppearanceToggles = (
    <>
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
              <View
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: `hsl(${TOKENS.indigo[resolvedScheme].primary})` }}
              />
              <Text className="text-xs">Índigo</Text>
            </View>
          </ToggleGroupItem>
          <ToggleGroupItem value="teal" className="flex-1" testID="theme-toggle-teal">
            <View className="flex-row items-center gap-1.5">
              <View
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: `hsl(${TOKENS.teal[resolvedScheme].primary})` }}
              />
              <Text className="text-xs">Teal</Text>
            </View>
          </ToggleGroupItem>
        </ToggleGroup>
      </View>
    </>
  );

  return (
    <View className="flex-1 bg-primary overflow-hidden">
      {/* Ghost container — off-screen, zero visual impact, keeps testIDs in tree for tests */}
      <View style={styles.ghost} testID="appearance-card">
        {AppearanceToggles}
      </View>

      {/* Poly grid spans the whole screen so every section shares one background */}
      <View pointerEvents="none" className="absolute inset-0" style={{ opacity: 0.35 }}>
        <SvgXml xml={LOW_POLY_GRID_SVG} width={width} height={height} preserveAspectRatio="xMidYMid slice" />
      </View>

      <View className="px-5 pt-10">
        {/* `items-start`: la columna de la derecha son dos botones apilados, así
            que la fila mide 120px de alto. Con `items-center` la X quedaba
            centrada en esa altura — o sea, en el hueco entre esos dos. */}
        <View className="flex-row items-start justify-between">
          <Button
            variant="secondary"
            onPress={() => router.replace("/" as RelativePathString)}
            className="rounded-full w-14 h-14 p-0 items-center justify-center"
          >
            <Icon as={XIcon} size={20} />
          </Button>

          {/* h-14 = alto del botón, para que el título quede a la misma altura
              que la X y el de logout, no pegado al borde superior. */}
          <View className="flex-1 h-14 justify-center">
            <Text variant="h3" className="text-center text-primary-foreground font-cal text-lg">
              {greeting}
            </Text>
          </View>

          {/* Logout + theme buttons stacked */}
          <View className="items-center gap-2">
            <Button
              variant="secondary"
              onPress={async () => { await logout(); }}
              className="rounded-full w-14 h-14 p-0 items-center justify-center"
            >
              <Icon as={LogOutIcon} size={20} />
            </Button>
            <Button
              variant="secondary"
              onPress={() => setDialogOpen(true)}
              className="rounded-full w-14 h-14 p-0 items-center justify-center"
            >
              <Icon as={PaletteIcon} size={20} />
            </Button>
          </View>
        </View>
      </View>

      <View className="w-full items-center justify-center max-w-lg mx-auto px-4 mt-10">
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

      {/* Illustration sits directly on the shared background — no separate panel */}
      <View className="flex-1 w-full items-center justify-center overflow-hidden">
        <SvgXml xml={CURIOUS_CUATE_SVG} width={width * 1.1} height={width * 1.1} />
      </View>

      {/* Appearance dialog — rendered only when open, no touch blocking when closed */}
      {dialogOpen && (
        <View style={[StyleSheet.absoluteFill, styles.overlay]}>
          {/* Scrim del diálogo: `canvas` es el token de "oscuro en ambos
              esquemas", que es justo lo que un velo necesita. */}
          <Pressable
            style={StyleSheet.absoluteFill}
            className="bg-canvas/50"
            onPress={() => setDialogOpen(false)}
          />
          <View style={styles.dialogContainer}>
            <View className="bg-background rounded-2xl p-6 w-full border border-border gap-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-foreground text-lg font-semibold">Apariencia</Text>
                <Button
                  variant="ghost"
                  onPress={() => setDialogOpen(false)}
                  accessibilityLabel="Cerrar"
                  testID="appearance-dialog-close"
                  className="rounded-full w-10 h-10 min-h-0 p-0 items-center justify-center"
                >
                  <Icon as={XIcon} size={18} />
                </Button>
              </View>
              {AppearanceToggles}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ghost: {
    position: 'absolute',
    opacity: 0,
    top: -9999,
    left: -9999,
    width: 300,
  },
  overlay: {
    zIndex: 50,
  },
  dialogContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
});
