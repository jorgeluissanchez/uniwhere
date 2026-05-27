import React, { createContext, useContext, useMemo } from "react";

import { TOKENS } from "@/core/constants/tokens";
import { Container } from "@/core/di/container";

import { AuthRemoteDataSourceImpl } from "@/features/auth/data/datasources/auth-remote-data-source-impl";
import { AuthRepositoryImpl } from "@/features/auth/data/repositories/auth-repository-impl";

import { FilePickerDataSourceImpl } from "@/features/viewer/data/datasources/file-picker-data-source-impl";
import { PlyStreamingParserDataSourceImpl } from "@/features/viewer/data/datasources/ply-streaming-parser-data-source-impl";
import { PlyRepositoryImpl } from "@/features/viewer/data/repositories/ply-repository-impl";

import { ReconstructionRemoteDataSourceImpl } from "@/features/reconstruction/data/datasources/reconstruction-remote-data-source-impl";
import { ReconstructionRepositoryImpl } from "@/features/reconstruction/data/repositories/reconstruction-repository-impl";

import { ScanRemoteDataSourceImpl } from "@/features/scan/data/datasources/scan-remote-data-source-impl";
import { ScanRepositoryImpl } from "@/features/scan/data/repositories/scan-repository-impl";

import { LocalizationRemoteDataSourceImpl } from "@/features/localization/data/datasources/localization-remote-data-source-impl";
import { LocalizationRepositoryImpl } from "@/features/localization/data/repositories/localization-repository-impl";

import { MeshFilePickerDataSourceImpl } from "@/features/mesh-viewer/data/datasources/mesh-file-picker-data-source-impl";
import { MeshLoaderDataSourceImpl } from "@/features/mesh-viewer/data/datasources/mesh-loader-data-source-impl";
import { MeshRepositoryImpl } from "@/features/mesh-viewer/data/repositories/mesh-repository-impl";

const DIContext = createContext<Container | null>(null);

type DIProviderProps = {
    children: React.ReactNode;
    overrides?: Map<symbol, unknown>;
};

export function DIProvider({ children, overrides }: DIProviderProps) {
    const container = useMemo(() => {
        const c = new Container();

        // auth
        const authDS = new AuthRemoteDataSourceImpl();
        const authRepo = new AuthRepositoryImpl(authDS);
        c.register(TOKENS.AuthRemoteDS, authDS)
         .register(TOKENS.AuthRepo, authRepo);

        // viewer
        const filePickerDS = new FilePickerDataSourceImpl();
        const plyParserDS = new PlyStreamingParserDataSourceImpl();
        const viewerRepo = new PlyRepositoryImpl(filePickerDS, plyParserDS);
        c.register(TOKENS.FilePickerDS, filePickerDS)
         .register(TOKENS.PlyParserDS, plyParserDS)
         .register(TOKENS.ViewerRepo, viewerRepo);

        // reconstruction
        const reconstructionRemoteDS = new ReconstructionRemoteDataSourceImpl();
        const reconstructionRepo = new ReconstructionRepositoryImpl(reconstructionRemoteDS);
        c.register(TOKENS.ReconstructionRemoteDS, reconstructionRemoteDS)
         .register(TOKENS.ReconstructionRepo, reconstructionRepo);

        // scan
        const scanRemoteDS = new ScanRemoteDataSourceImpl();
        const scanRepo = new ScanRepositoryImpl(scanRemoteDS);
        c.register(TOKENS.ScanRemoteDS, scanRemoteDS)
         .register(TOKENS.ScanRepo, scanRepo);

        // localization
        const localizationRemoteDS = new LocalizationRemoteDataSourceImpl();
        const localizationRepo = new LocalizationRepositoryImpl(localizationRemoteDS);
        c.register(TOKENS.Localization_RemoteDS, localizationRemoteDS)
         .register(TOKENS.Localization_Repo, localizationRepo);

        // mesh-viewer
        const meshPickerDS = new MeshFilePickerDataSourceImpl();
        const meshLoaderDS = new MeshLoaderDataSourceImpl();
        const meshRepo     = new MeshRepositoryImpl(meshPickerDS, meshLoaderDS);
        c.register(TOKENS.MeshPickerDS, meshPickerDS)
         .register(TOKENS.MeshLoaderDS, meshLoaderDS)
         .register(TOKENS.MeshRepo,     meshRepo);

        // Apply test overrides last so they win over real implementations
        overrides?.forEach((value, token) => c.register(token, value));

        return c;
    }, [overrides]);

    return <DIContext.Provider value={container}>{children}</DIContext.Provider>;
}

export function useDI() {
    const c = useContext(DIContext);
    if (!c) throw new Error("Falta DIProvider");
    return c;
}
