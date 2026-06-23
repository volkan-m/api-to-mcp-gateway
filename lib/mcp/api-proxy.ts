import axios from "axios";
import https from "https";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/server/crypto";

// Proxy call to the target external API. Existing MCP `api-proxy.ts` logic preserved:
//  - prod/test base URL or externalUrl selection based on activeEnv
//  - path/query parameter resolution
//  - auth priority: args.bearerToken > customHeaders.Authorization > DB credential > BEARER_TOKEN env

export async function proxyApiCall(
  integrationId: string,
  endpointId: string,
  args: Record<string, unknown>,
  customHeaders?: Record<string, string>,
): Promise<{ status: number; data: unknown }> {
  // Work with a shallow copy to avoid mutating the caller's args object.
  // (path/query parameters are deleted from args below.)
  args = { ...args };

  const endpoint = await prisma.endpoint.findUnique({
    where: { id: endpointId },
    include: { apiIntegration: true },
  });

  if (!endpoint) throw new Error("Endpoint not found");

  const integration = endpoint.apiIntegration;

  // An integration can have multiple credentials (e.g. header + query).
  // All are applied.
  const credentials = await prisma.apiCredential.findMany({
    where: { apiIntegrationId: integrationId },
  });

  const inputSchema = JSON.parse(endpoint.inputSchema || "{}");
  const parameters: Array<Record<string, unknown>> = inputSchema.parameters || inputSchema.Parameters || [];

  // URL setup
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

  // Path parameters
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

  // Query parameters
  const queryParams = new URLSearchParams();
  parameters.forEach((param) => {
    const name = (param.name ?? param.Name) as string | undefined;
    const location = ((param.in ?? param.In) as string | undefined)?.toLowerCase();
    if (location === "query" && name && args[name] !== undefined) {
      queryParams.append(name, String(args[name]));
    }
  });

  // Remove processed parameters from args
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

  // Header / auth resolution.
  // Priority: args.bearerToken > customHeaders.Authorization > DB credentials > BEARER_TOKEN env.
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

  // Apply DB credentials. Multiple are supported (e.g. header + query).
  // Authorization already set via args/customHeaders is not overwritten.
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

  // If no auth has been set, fall back to env token as last resort.
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
    // TLS validation is ON by default (secure). Can be disabled with MCP_PROXY_INSECURE_TLS=true
    // for internal APIs with self-signed certificates.
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
