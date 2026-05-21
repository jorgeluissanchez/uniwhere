import { ILocalPreferences } from "@/core/storage/i-local-preferences";
import { LocalPreferencesAsyncStorage } from "@/core/storage/local-preferences-async-storage";
import { AuthRemoteDataSource } from "./auth-remote-data-source";

function decodeJwtPayload(token: string): Record<string, any> {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  private readonly projectId: string;
  private readonly baseUrl: string;
  private readonly dbUrl: string;

  private prefs: ILocalPreferences;

  constructor(projectId = process.env.EXPO_PUBLIC_ROBLE_PROJECT_ID) {
    if (!projectId) {
      throw new Error("Falta la variable de entorno EXPO_PUBLIC_ROBLE_PROJECT_ID");
    }
    this.projectId = projectId;
    this.baseUrl = `${process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://roble-api.openlab.uninorte.edu.co"}/auth/${this.projectId}`;
    this.dbUrl = `${process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://roble-api.openlab.uninorte.edu.co"}/database/${this.projectId}`;
    this.prefs = LocalPreferencesAsyncStorage.getInstance();
  }
  async login(email: string, password: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const token = data["accessToken"];
        const refreshToken = data["refreshToken"];
        if (!token || !refreshToken) throw new Error("Respuesta de login inválida: faltan tokens");
        const payload = decodeJwtPayload(token);
        const userId = payload["sub"];
        if (!userId) throw new Error("Token inválido: no se encontró el identificador de usuario");
        await this.prefs.storeData("token", token);
        await this.prefs.storeData("refreshToken", refreshToken);
        await this.prefs.storeData("userId", userId);
        await this.prefs.storeData("email", email);

        const userRows = await fetch(
          `${this.dbUrl}/read?tableName=user&user_id=${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ).then((r) => r.json()).catch(() => []);

        const role = userRows[0]?.role ?? "student";
        const name = userRows[0]?.name ?? "";
        await this.prefs.storeData("role", role);
        await this.prefs.storeData("name", name);

        return Promise.resolve();
      } else {
        const body = await response.json();
        throw new Error(`Error al iniciar sesión: ${body.message}`);
      }
    } catch (e: any) {
      throw e;
    }
  }

  async signUp(email: string, password: string, name: string, role: string = "student"): Promise<void> {
    const signupResponse = await fetch(`${this.baseUrl}/signup-direct`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ email, name, password }),
    });

    if (!signupResponse.ok) {
      const body = await signupResponse.json();
      const message = Array.isArray(body.message)
        ? body.message.join(" ")
        : body.message ?? "Error de registro desconocido";
      throw new Error(`Error al registrar la cuenta: ${message}`);
    }

    const loginBody = JSON.stringify({ email, password });
    let loginResponse: Response | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      await new Promise((r) => setTimeout(r, attempt * 1000));
      loginResponse = await fetch(`${this.baseUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: loginBody,
      });
      if (loginResponse.ok) break;
    }

    if (!loginResponse || !loginResponse.ok) {
      const body = await loginResponse?.json().catch(() => ({}));
      throw new Error(`Cuenta creada pero no se pudo iniciar sesión: ${body.message ?? "intenta iniciar sesión manualmente"}`);
    }

    const data = await loginResponse.json();
    const token = data["accessToken"];
    const refreshToken = data["refreshToken"];
    if (!token || !refreshToken) throw new Error("Respuesta de login inválida: faltan tokens");

    const payload = decodeJwtPayload(token);
    const userId = payload["sub"];
    if (!userId) throw new Error("Token inválido: no se encontró el identificador de usuario");

    await this.prefs.storeData("token", token);
    await this.prefs.storeData("refreshToken", refreshToken);
    await this.prefs.storeData("userId", userId);
    await this.prefs.storeData("email", email);
    await this.prefs.storeData("name", name);

    await fetch(`${this.dbUrl}/insert`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        tableName: "user",
        records: [{ user_id: userId, email, name, role }],
      }),
    });

    await this.prefs.storeData("role", role);
  }

  async refreshUserProfile(): Promise<void> {
    const userId = await this.prefs.retrieveData<string>("userId");
    const token = await this.prefs.retrieveData<string>("token");
    if (!userId || !token) return;
    const rows = await fetch(`${this.dbUrl}/read?tableName=user&user_id=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()).catch(() => []);
    if (rows[0]) {
      await this.prefs.storeData("name", rows[0].name ?? "");
      await this.prefs.storeData("role", rows[0].role ?? "student");
    }
  }

  async logOut(): Promise<void> {
    try {
      const token = await this.prefs.retrieveData<string>("token");
      if (!token) throw new Error("No se encontró el token");

      const response = await fetch(`${this.baseUrl}/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await this.prefs.removeData("token");
        await this.prefs.removeData("refreshToken");
        await this.prefs.removeData("userId");
        await this.prefs.removeData("email");
        return Promise.resolve();
      } else {
        const body = await response.json();
        throw new Error(`Error al cerrar sesión: ${body.message}`);
      }
    } catch (e: any) {
      throw e;
    }
  }
  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await this.prefs.retrieveData<string>("refreshToken");
      if (!refreshToken) {
        console.warn("Falló la renovación del token", "No se encontró el refresh token");
        return false;
      }
      const response = await fetch(`${this.baseUrl}/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        const newToken = data["accessToken"];
        await this.prefs.storeData("token", newToken);
        return true;
      } else {
        const body = await response.json();
        throw new Error(`Error al renovar el token: ${body.message}`);
      }
    } catch (e: any) {
      console.error("Falló la renovación del token", e);
      throw e;
    }
  }

  forgotPassword(email: string): Promise<void> {
    throw new Error("Método no implementado.");
  }

  resetPassword(
    email: string,
    newPassword: string,
    validationCode: string,
  ): Promise<boolean> {
    throw new Error("Método no implementado.");
  }

  async verifyToken(): Promise<boolean> {
    try {
      const token = await this.prefs.retrieveData<string>("token");
      if (!token) return false;

      const response = await fetch(`${this.baseUrl}/verify-token`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        console.log("El token es válido");
        return true;
      } else {
        const body = await response.json();
        console.error(`Error de verificación del token: ${body.message}`);
        return false;
      }
    } catch (e: any) {
      console.error("Falló la verificación del token", e);
      return false;
    }
  }
}