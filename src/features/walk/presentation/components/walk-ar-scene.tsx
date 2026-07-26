/**
 * ViroARScene con el callback de pose conectado al data source AR.
 *
 * Esta pieza sólo inicializa el AR y propaga la pose. El render del PLY
 * ocurre en `walk-canvas.tsx`, en paralelo, reusando el stack Three.js
 * existente (expo-gl + @react-three/fiber/native). Mantener separadas las
 * dos superficies evita que el motor de Viro intente renderizar el PLY —
 * Viro no soporta PLY y forzar la carga pegaría con sus asunciones.
 *
 * Estructura:
 *   <ViroARSceneNavigator initialScene={...}>
 *     <ViroARScene displayArScene onCameraTransformUpdate={...}>
 *       <ViroAmbientLight />
 *       <ViroNode position={...} />
 *     </ViroARScene>
 *   </ViroARSceneNavigator>
 *
 * Las luces son cosmética — el PLY las ignora porque vive en su propio
 * Canvas. Sin ellas, sin embargo, Viro protesta en consola.
 *
 * IMPORTANTE: este archivo debe importarse **dinámicamente** desde el
 * screen. Importarlo en el top-level de cualquier screen rompe Expo Go
 * porque Viro llama a `NativeModules.VRTMaterialManager` y
 * `NativeModules.VRTAnimationModule` en *evaluación de módulo*, y esos
 * módulos nativos no existen fuera de un development build.
 */
import { useDI } from "@/core/di/di-provider";
import { TOKENS } from "@/core/constants/tokens";
import { ViroAmbientLight, ViroARScene, ViroARSceneNavigator, ViroNode } from "@reactvision/react-viro";
import React, { useCallback } from "react";

import { ArCameraViroDataSourceImpl } from "../../data/datasources/ar-camera-viro-data-source-impl";

type Props = {
  /**
   * Offset del PLY en coords centradas. Aplicado al `<ViroNode>` raíz para
   * que el centro del PLY coincida con el anchor de Viro.
   */
  offset: readonly [number, number, number];
};

export function WalkArScene({ offset }: Props) {
  const di = useDI();
  const cameraDS = di.resolve<ArCameraViroDataSourceImpl>(TOKENS.WalkArCameraDS);

  const onCameraTransformUpdate = useCallback(
    (viro: {
      position: ReadonlyArray<number>;
      rotation: ReadonlyArray<number>;
    }) => {
      const [px, py, pz] = viro.position;
      const [rx, ry, rz, rw] = viro.rotation;
      cameraDS.publishFromViro({
        position: [px, py, pz],
        rotation: [rx, ry, rz, rw],
      });
    },
    [cameraDS],
  );

  return (
    <ViroARSceneNavigator
      autofocus
      initialScene={{
        scene: () => (
          <ViroARScene onCameraTransformUpdate={onCameraTransformUpdate}>
            <ViroAmbientLight color="#ffffff" intensity={1000} />
            <ViroNode position={[-offset[0], -offset[1], -offset[2]]} />
          </ViroARScene>
        ),
      }}
    />
  );
}
