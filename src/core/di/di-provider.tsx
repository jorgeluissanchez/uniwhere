import React, { createContext, useContext, useMemo } from "react";

import { TOKENS } from "@/core/constants/tokens";
import { Container } from "@/core/di/container";
import { AuthRemoteDataSourceImpl } from "@/features/auth/data/datasources/auth-remote-data-source-impl";
import { AuthRepositoryImpl } from "@/features/auth/data/repositories/auth-repository-impl";
import { CourseRemoteDataSourceImpl } from "@/features/courses/data/datasources/course-remote-data-source-impl";
import { CourseRepositoryImpl } from "@/features/courses/data/repositories/course-repository-impl";
import { EvaluationRemoteDataSourceImpl } from "@/features/evaluation/data/datasources/evaluation-remote-data-source-impl";
import { EvaluationRepositoryImpl } from "@/features/evaluation/data/repositories/evaluation-repository-impl";

const DIContext = createContext<Container | null>(null);

export function DIProvider({ children }: { children: React.ReactNode }) {
    const container = useMemo(() => {
        const c = new Container();

        const authDS = new AuthRemoteDataSourceImpl();
        const authRepo = new AuthRepositoryImpl(authDS);
        c.register(TOKENS.AuthRemoteDS, authDS)
            .register(TOKENS.AuthRepo, authRepo);

        const courseDS = new CourseRemoteDataSourceImpl(authDS);
        const courseRepo = new CourseRepositoryImpl(courseDS);
        c.register(TOKENS.CourseRemoteDS, courseDS)
            .register(TOKENS.CourseRepo, courseRepo);

        const evaluationDS = new EvaluationRemoteDataSourceImpl(authDS);
        const evaluationRepo = new EvaluationRepositoryImpl(evaluationDS);
        c.register(TOKENS.EvaluationRemoteDS, evaluationDS)
            .register(TOKENS.EvaluationRepo, evaluationRepo);

        return c;
    }, []);

    return <DIContext.Provider value={container}>{children}</DIContext.Provider>;
}

export function useDI() {
    const c = useContext(DIContext);
    if (!c) throw new Error("Falta DIProvider");
    return c;
}
