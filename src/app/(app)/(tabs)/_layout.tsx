import { useAppTheme } from "@/core/hooks/use-app-theme";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { Tabs, useSegments } from "expo-router";
import { Camera, Cpu, User } from "lucide-react-native";
import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";

type LucideIcon = typeof Camera;

function BottomIcon({
  Icon,
  focused,
  primaryHsl,
  mutedHsl,
}: {
  Icon: LucideIcon;
  focused: boolean;
  primaryHsl: string;
  mutedHsl: string;
}) {
  return (
    <View
      style={[
        styles.bottomIcon,
        { backgroundColor: focused ? primaryHsl : "transparent" },
      ]}
    >
      <Icon
        size={20}
        color={focused ? "#fff" : mutedHsl}
        strokeWidth={focused ? 2.5 : 1.8}
      />
    </View>
  );
}

function SidebarIcon({
  Icon,
  focused,
  primaryHsl,
  mutedHsl,
}: {
  Icon: LucideIcon;
  focused: boolean;
  primaryHsl: string;
  mutedHsl: string;
}) {
  return (
    <View style={styles.sidebarIcon}>
      {focused && (
        <View
          style={[StyleSheet.absoluteFillObject, styles.sidebarFocusBg, { backgroundColor: primaryHsl }]}
        />
      )}
      <Icon
        size={20}
        color={focused ? primaryHsl : mutedHsl}
        strokeWidth={focused ? 2.5 : 1.8}
      />
    </View>
  );
}

export default function TabsLayout() {
  const { loggedUser } = useAuth();
  const { tokens } = useAppTheme();
  const segments = useSegments();
  const { width } = useWindowDimensions();
  const isSidebar = width >= 768;
  const isSettingsScreen = segments.at(-1) === "settings";

  const primaryHsl = `hsl(${tokens.primary})`;
  const mutedHsl = `hsl(${tokens.mutedForeground})`;
  const cardHsl = `hsl(${tokens.card})`;
  const borderHsl = `hsl(${tokens.border})`;

  const displayName = loggedUser?.name
    ? loggedUser.name.split(" ")[0]
    : (loggedUser?.email?.split("@")[0] ?? "Perfil");

  const iconProps = (focused: boolean) => ({ focused, primaryHsl, mutedHsl });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: isSidebar ? "left" : "bottom",
        tabBarShowLabel: !isSidebar,
        tabBarActiveBackgroundColor: "transparent",
        tabBarInactiveBackgroundColor: "transparent",
        tabBarActiveTintColor: primaryHsl,
        tabBarInactiveTintColor: mutedHsl,
        tabBarStyle: isSettingsScreen
          ? { display: "none" }
          : isSidebar
          ? {
              width: 94,
              minWidth: 94,
              maxWidth: 94,
              backgroundColor: cardHsl,
              borderRightWidth: 1,
              borderRightColor: borderHsl,
              paddingTop: 16,
              paddingBottom: 16,
              elevation: 0,
              shadowOpacity: 0,
            }
          : {
              backgroundColor: cardHsl,
              borderTopWidth: 0,
              elevation: 0,
              shadowOpacity: 0,
              height: 110,
              paddingTop: 12,
              boxShadow: "0px -4px 12px rgba(0,0,0,0.06)",
            },
        tabBarItemStyle: isSidebar
          ? {
              height: 56,
              width: 64,
              alignItems: "center",
              justifyContent: "center",
              marginVertical: 2,
              borderRadius: 0,
              padding: 0,
            }
          : undefined,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="scan"
        options={{
          title: "Escaneos",
          tabBarIcon: ({ focused }) =>
            isSidebar ? (
              <SidebarIcon Icon={Camera} {...iconProps(focused)} />
            ) : (
              <BottomIcon Icon={Camera} {...iconProps(focused)} />
            ),
        }}
      />
      <Tabs.Screen
        name="demo"
        options={{
          title: "AR Demo",
          tabBarIcon: ({ focused }) =>
            isSidebar ? (
              <SidebarIcon Icon={Cpu} {...iconProps(focused)} />
            ) : (
              <BottomIcon Icon={Cpu} {...iconProps(focused)} />
            ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: displayName,
          tabBarIcon: ({ focused }) =>
            isSidebar ? (
              <SidebarIcon Icon={User} {...iconProps(focused)} />
            ) : (
              <BottomIcon Icon={User} {...iconProps(focused)} />
            ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bottomIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  sidebarFocusBg: {
    borderRadius: 14,
    opacity: 0.15,
  },
});
