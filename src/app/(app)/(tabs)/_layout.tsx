import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { Tabs, useSegments } from "expo-router";
import { BarChart3, Camera, Home, User } from "lucide-react-native";
import React from "react";
import { useWindowDimensions, View } from "react-native";

const PRIMARY = "#3B82F6";

type LucideIcon = typeof Home;

function BottomIcon({ Icon, focused }: { Icon: LucideIcon; focused: boolean }) {
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: focused ? PRIMARY : "transparent",
      }}
    >
      <Icon size={20} color={focused ? "#fff" : "#9CA3AF"} strokeWidth={focused ? 2.5 : 1.8} />
    </View>
  );
}

function SidebarIcon({ Icon, focused }: { Icon: LucideIcon; focused: boolean }) {
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: focused ? "#EFF6FF" : "transparent",
      }}
    >
      <Icon size={20} color={focused ? PRIMARY : "#6B7280"} strokeWidth={focused ? 2.5 : 1.8} />
    </View>
  );
}

export default function TabsLayout() {
  const { loggedUser } = useAuth();
  const segments = useSegments();
  const { width } = useWindowDimensions();
  const isSidebar = width >= 768;
  const isSettingsScreen = segments.at(-1) === "settings";

  const displayName = loggedUser?.name
    ? loggedUser.name.split(" ")[0]
    : (loggedUser?.email?.split("@")[0] ?? "Perfil");
  const isAdmin = loggedUser?.role === "admin";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: isSidebar ? "left" : "bottom",
        tabBarShowLabel: !isSidebar,
        tabBarActiveBackgroundColor: "transparent",
        tabBarInactiveBackgroundColor: "transparent",
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: isSettingsScreen
          ? { display: "none" }
          : isSidebar
          ? {
              width: 94,
              minWidth: 94,
              maxWidth: 94,
              backgroundColor: "#fff",
              borderRightWidth: 1,
              borderRightColor: "#F3F4F6",
              paddingTop: 16,
              paddingBottom: 16,
              elevation: 0,
              shadowOpacity: 0,
            }
          : {
              backgroundColor: "#fff",
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
        name="home"
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused }) =>
            isSidebar ? (
              <SidebarIcon Icon={Home} focused={focused} />
            ) : (
              <BottomIcon Icon={Home} focused={focused} />
            ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Escanear",
          tabBarIcon: ({ focused }) =>
            isSidebar ? (
              <SidebarIcon Icon={Camera} focused={focused} />
            ) : (
              <BottomIcon Icon={Camera} focused={focused} />
            ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Admin",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ focused }) =>
            isSidebar ? (
              <SidebarIcon Icon={BarChart3} focused={focused} />
            ) : (
              <BottomIcon Icon={BarChart3} focused={focused} />
            ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: displayName,
          tabBarIcon: ({ focused }) =>
            isSidebar ? (
              <SidebarIcon Icon={User} focused={focused} />
            ) : (
              <BottomIcon Icon={User} focused={focused} />
            ),
        }}
      />
    </Tabs>
  );
}
