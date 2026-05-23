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

import { RouteStorageDataSourceImpl } from "@/features/ar/data/datasources/route-storage-data-source-impl";
import { RouteRepositoryImpl } from "@/features/ar/data/repositories/route-repository-impl";

const DIContext = createContext<Container | null>(null);

export function DIProvider({ children }: { children: React.ReactNode }) {
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

        // ar
        const routeStorageDS = new RouteStorageDataSourceImpl();
        const routeRepo = new RouteRepositoryImpl(routeStorageDS);
        c.register(TOKENS.AR_RouteStorageDS, routeStorageDS)
         .register(TOKENS.AR_RouteRepo, routeRepo);

        return c;
    }, []);

    return <DIContext.Provider value={container}>{children}</DIContext.Provider>;
}

export function useDI() {
    const c = useContext(DIContext);
    if (!c) throw new Error("Falta DIProvider");
    return c;
}
