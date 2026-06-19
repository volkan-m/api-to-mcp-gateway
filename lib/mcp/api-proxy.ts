import axios from "axios";
import https from "https";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/server/crypto";

// Hedef dış API'ye proxy çağrısı. Mevcut MCP `api-proxy.ts` mantığı korunmuştur:
//  - activeEnv'e göre prod/test base URL veya externalUrl seçimi
//  - path/query parametre çözümleme
//  - yetki önceliği: args.bearerToken > customHeaders.Authorization > DB credential > BEARER_TOKEN env

export async function proxyApiCall(
  integrationId: string,
  endpointId: string,
  args: Record<string, unknown>,
  customHeaders?: Record<string, string>,
): Promise<{ status: number; data: unknown }> {
  // Çağıranın args nesnesini mutasyona uğratmamak için sığ kopya ile çalış.
  // (Aşağıda path/query parametreleri args'tan delete ediliyor.)
  args = { ...args };

  const endpoint = await prisma.endpoint.findUnique({
    where: { id: endpointId },
    include: { apiIntegration: true },
  });

  if (!endpoint) throw new Error("Endpoint not found");

  const integration = endpoint.apiIntegration;

  // Bir entegrasyonun birden fazla credential'ı olabilir (ör. header + query).
  // Hepsi uygulanır.
  const credentials = await prisma.apiCredential.findMany({
    where: { apiIntegrationId: integrationId },
  });

  const inputSchema = JSON.parse(endpoint.inputSchema || "{}");
  const parameters: Array<Record<string, unknown>> = inputSchema.parameters || inputSchema.Parameters || [];

  // URL kurulumu
  const isProd = integration.activeEnv === "prod";

  let url: string;
  if (isProd && endpoint.externalUrlProd) {
    url = endpoint.externalUrlProd;
  } else if (!isProd && endpoint.externalUrlTest) {
    url = endpoint.externalUrlTest;
  } else {
    const baseUrl = isProd ? integration.baseUrlProd : integration.baseUrlTest;
    if (baseUrl.endsWith("/") && endpoint.path.startsWith("/")) {
      url = `${baseUrl}${endpoint.path.substring(1)}`;
    } else if (!baseUrl.endsWith("/") && !endpoint.path.startsWith("/")) {
      url = `${baseUrl}/${endpoint.path}`;
    } else {
      url = `${baseUrl}${endpoint.path}`;
    }
  }

  // Path parametreleri
  const pathParams = endpoint.path.match(/\{([^}]+)\}/g);
  const pathParamNames: string[] = [];
  if (pathParams) {
    pathParams.forEach((param) => {
      const paramName = param.replace(/[{}]/g, "");
      pathParamNames.push(paramName);
      if (args[paramName] !== undefined) {
        url = url.replace(param, String(args[paramName]));
      }
    });
  }

  // Query parametreleri
  const queryParams = new URLSearchParams();
  parameters.forEach((param) => {
    const name = (param.name ?? param.Name) as string | undefined;
    const location = ((param.in ?? param.In) as string | undefined)?.toLowerCase();
    if (location === "query" && name && args[name] !== undefined) {
      queryParams.append(name, String(args[name]));
    }
  });

  // İşlenen parametreleri args'tan çıkar
  pathParamNames.forEach((paramName) => delete args[paramName]);
  parameters.forEach((param) => {
    const name = (param.name ?? param.Name) as string | undefined;
    const location = ((param.in ?? param.In) as string | undefined)?.toLowerCase();
    if (name && (location === "query" || location === "path")) {
      delete args[name];
    }
  });

  if (queryParams.toString()) {
    url += `?${queryParams.toString()}`;
  }

  // Header / yetki çözümleme.
  // Öncelik: args.bearerToken > customHeaders.Authorization > DB credential'lar > BEARER_TOKEN env.
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  let authHeaderSet = false;

  if (args.bearerToken) {
    headers["Authorization"] = `Bearer ${args.bearerToken}`;
    delete args.bearerToken;
    authHeaderSet = true;
  } else if (
    customHeaders &&
    (customHeaders["authorization"] || customHeaders["Authorization"])
  ) {
    headers["Authorization"] =
      customHeaders["authorization"] || customHeaders["Authorization"];
    authHeaderSet = true;
  }

  // DB credential'larını uygula. Birden fazla desteklenir (header + query gibi).
  // Authorization, args/customHeaders ile zaten ayarlandıysa üzerine yazılmaz.
  for (const credential of credentials) {
    const decryptedValue = decrypt(credential.keyValue);
    if (credential.credentialType === "header") {
      if (credential.keyName.toLowerCase() === "authorization" && authHeaderSet) {
        continue;
      }
      headers[credential.keyName] = decryptedValue;
      if (credential.keyName.toLowerCase() === "authorization") {
        authHeaderSet = true;
      }
    } else if (credential.credentialType === "bearer") {
      if (authHeaderSet) continue;
      headers["Authorization"] = `Bearer ${decryptedValue}`;
      authHeaderSet = true;
    } else if (credential.credentialType === "query") {
      url += url.includes("?") ? "&" : "?";
      url += `${encodeURIComponent(credential.keyName)}=${encodeURIComponent(decryptedValue)}`;
    }
  }

  // Hiçbir yetki ayarlanmadıysa son çare olarak env fallback token.
  if (!authHeaderSet && process.env.BEARER_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.BEARER_TOKEN}`;
  }

  // Request body
  let body: unknown = undefined;
  if (["POST", "PUT", "PATCH"].includes(endpoint.method)) {
    if (Object.keys(args).length > 0) {
      if (args.body !== undefined) {
        body = args.body;
      } else if (args.requestBody !== undefined) {
        body = args.requestBody;
      } else {
        body = args;
      }
    } else {
      body = {};
    }
  }

  try {
    // TLS doğrulaması varsayılan olarak AÇIKTIR (güvenli). Self-signed sertifikalı
    // dahili API'ler için MCP_PROXY_INSECURE_TLS=true ile devre dışı bırakılabilir.
    const insecureTls = process.env.MCP_PROXY_INSECURE_TLS === "true";

    const response = await axios({
      url,
      method: endpoint.method,
      headers,
      data: body,
      httpsAgent: insecureTls
        ? new https.Agent({ rejectUnauthorized: false })
        : undefined,
    });

    return { status: response.status, data: response.data };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    throw error;
  }
}
