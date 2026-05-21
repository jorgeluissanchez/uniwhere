import { Button } from "@/core/components/ui/button";
import { Text } from "@/core/components/ui/text";
import { RelativePathString, useRouter } from "expo-router";
import React from "react";
import { Dimensions, View } from "react-native";
import { SvgXml } from "react-native-svg";
import { BG_SVG } from "../../../assets/svgs/bg";
import { HOMBRE_SVG } from "../../../assets/svgs/hombre";
import { MUJER_SVG } from "../../../assets/svgs/mujer";

export default function LandingScreen() {
  const router = useRouter();

const { width } = Dimensions.get("window");
  return (
    <View className="flex-1 w-full bg-blue-50">
      <Text className="text-lg p-10 text-center text-blue-500 tracking-wide font-bold">UniWhere</Text>
      <View className="flex-row a justify-center gap-10 mt-12">
        <SvgXml xml={HOMBRE_SVG} width="150" height="200" style={{transform: [{ translateY: width < 450 ? 70 : 0 }] }} />
        <SvgXml xml={MUJER_SVG} width="150" height="200" style={{transform: [{ translateY: width < 450 ? 70 : 0 }] }} />
      </View>
      {width < 450 && <SvgXml width={width} height={width / 4} xml={BG_SVG} className="translate-y-5" /> }
      <View className="relative bg-white flex-1 px-8 pt-6 pb-12 gap-5 items-center justify-center">
        <View className="gap-2 w-full max-w-lg">
          <Text variant="h2" className="text-center text-blue-700">
            Explora los espacios de tu universidad
          </Text>
          <Text className="text-gray-400 text-center italic">
            Escanea y descubre los espacios universitarios a través de fotos.
          </Text>
        </View>
        <Button
          className="w-full max-w-lg bg-blue-500"
          onPress={() => router.push("/login" as RelativePathString)}>
          <Text className="text-white font-semibold">INICIAR SESIÓN</Text>
        </Button>
      </View>
    </View>
  );
}
