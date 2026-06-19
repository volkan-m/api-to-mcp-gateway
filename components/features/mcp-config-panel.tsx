"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";

type OSPlatform = "windows" | "macos" | "linux";
type TargetPlatform = "claude-desktop" | "n8n" | "openai" | "anthropic";
type Language = "python" | "javascript";

const TARGETS: TargetPlatform[] = ["claude-desktop", "n8n", "openai", "anthropic"];
const OSES: OSPlatform[] = ["windows", "macos", "linux"];
const LANGS: Language[] = ["python", "javascript"];

function claudeConfigPath(os: OSPlatform): string {
  switch (os) {
    case "windows":
      return "%APPDATA%\\Claude\\claude_desktop_config.json";
    case "macos":
      return "~/Library/Application Support/Claude/claude_desktop_config.json";
    case "linux":
      return "~/.config/Claude/claude_desktop_config.json";
  }
}

export function McpConfigPanel({ integrationId }: { integrationId: string }) {
  const { t } = useTranslation();
  const [origin, setOrigin] = useState("");
  const [target, setTarget] = useState<TargetPlatform>("claude-desktop");
  const [os, setOs] = useState<OSPlatform>("windows");
  const [language, setLanguage] = useState<Language>("python");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const httpEndpoint = `${origin || "http://localhost:3000"}/api/mcp`;

  // Hedef platforma göre üretilen yapılandırma (JSON).
  const config = useMemo<Record<string, unknown>>(() => {
    if (target === "claude-desktop") {
      return {
        mcpServers: {
          "mcp-gateway": {
            command: "npm",
            args: ["run", "mcp:stdio"],
            cwd: "c:/Sources/BruteForceRepo/MCPGateWay",
            env: { INTEGRATION_ID: integrationId },
          },
        },
      };
    }
    // n8n / openai / anthropic: HTTP transport ile çalışır.
    return {
      transport: "http",
      url: httpEndpoint,
      headers: {
        "X-Integration-Id": integrationId,
        "X-API-Key": "<AUTH_TOKEN>",
      },
      methods: {
        listTools: { method: "listTools" },
        callTool: {
          method: "callTool",
          params: { name: "<toolName>", arguments: {} },
        },
      },
    };
  }, [target, integrationId, httpEndpoint]);

  const configJson = JSON.stringify(config, null, 2);

  const installSteps = useMemo<string[]>(() => {
    switch (target) {
      case "claude-desktop":
        return t("mcpConfig.installationStepsClaude") as unknown as string[];
      case "n8n":
        return t("mcpConfig.installationStepsN8n") as unknown as string[];
      case "openai":
        return t("mcpConfig.installationStepsOpenAI") as unknown as string[];
      case "anthropic":
        return t("mcpConfig.installationStepsAnthropic") as unknown as string[];
    }
  }, [target, t]);

  // t() dizileri string döndürmez; doğrudan sözlükten almak için translations kullanmıyoruz,
  // bu yüzden adımları translations üzerinden çekiyoruz (aşağıdaki useTranslationSteps).
  const steps = useStepArray(target);

  const getToolsCode =
    language === "python"
      ? `import requests

res = requests.post(
    "${httpEndpoint}",
    headers={
        "X-Integration-Id": "${integrationId}",
        "X-API-Key": "<AUTH_TOKEN>",
    },
    json={"method": "listTools"},
)
tools = res.json()
print(tools)`
      : `const res = await fetch("${httpEndpoint}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Integration-Id": "${integrationId}",
    "X-API-Key": "<AUTH_TOKEN>",
  },
  body: JSON.stringify({ method: "listTools" }),
});
const tools = await res.json();
console.log(tools);`;

  const callToolCode =
    language === "python"
      ? `import requests

res = requests.post(
    "${httpEndpoint}",
    headers={
        "X-Integration-Id": "${integrationId}",
        "X-API-Key": "<AUTH_TOKEN>",
    },
    json={
        "method": "callTool",
        "params": {"name": "<toolName>", "arguments": {}},
    },
)
print(res.json())`
      : `const res = await fetch("${httpEndpoint}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Integration-Id": "${integrationId}",
    "X-API-Key": "<AUTH_TOKEN>",
  },
  body: JSON.stringify({
    method: "callTool",
    params: { name: "<toolName>", arguments: {} },
  }),
});
console.log(await res.json());`;

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(t("common.copied"));
    setTimeout(() => setCopiedKey(null), 2000);
  }

  function download() {
    const blob = new Blob([configJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `config_${target}_${os}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const showOs = target === "claude-desktop";
  const showLanguage = target === "openai" || target === "anthropic";
  const showCode = showLanguage;

  return (
    <div className="space-y-4">
      {/* Platform seçimi */}
      <Card>
        <CardHeader>
          <CardTitle>{t("mcpConfig.platformSelection")}</CardTitle>
          <CardDescription>{t("mcpConfig.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">
              {t("mcpConfig.targetPlatform")}
            </p>
            <div className="flex flex-wrap gap-2">
              {TARGETS.map((tg) => (
                <Button
                  key={tg}
                  size="sm"
                  variant={target === tg ? "default" : "outline"}
                  onClick={() => setTarget(tg)}
                >
                  {t(
                    `mcpConfig.${
                      tg === "claude-desktop" ? "claudeDesktop" : tg
                    }`,
                  )}
                </Button>
              ))}
            </div>
          </div>

          {showOs && (
            <div>
              <p className="mb-2 text-sm font-medium">{t("mcpConfig.os")}</p>
              <div className="flex flex-wrap gap-2">
                {OSES.map((o) => (
                  <Button
                    key={o}
                    size="sm"
                    variant={os === o ? "default" : "outline"}
                    onClick={() => setOs(o)}
                  >
                    {t(`mcpConfig.${o}`)}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {showLanguage && (
            <div>
              <p className="mb-2 text-sm font-medium">
                {t("mcpConfig.language")}
              </p>
              <div className="flex flex-wrap gap-2">
                {LANGS.map((l) => (
                  <Button
                    key={l}
                    size="sm"
                    variant={language === l ? "default" : "outline"}
                    onClick={() => setLanguage(l)}
                  >
                    {t(`mcpConfig.${l}`)}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* HTTP endpoint bilgisi */}
      <Card>
        <CardHeader>
          <CardTitle>{t("mcpConfig.httpEndpoint")}</CardTitle>
          <CardDescription>{t("mcpConfig.integrationIdHeader")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-muted px-3 py-2 text-xs">
              POST {httpEndpoint}
            </code>
            <Button
              size="icon"
              variant="outline"
              onClick={() => copy(httpEndpoint, "endpoint")}
            >
              {copiedKey === "endpoint" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Kurulum adımları */}
      <Card>
        <CardHeader>
          <CardTitle>{t("mcpConfig.installationSteps")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
            {steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Config dosyası konumu (yalnızca Claude Desktop) */}
      {showOs && (
        <Card>
          <CardHeader>
            <CardTitle>{t("mcpConfig.configFileLocation")}</CardTitle>
          </CardHeader>
          <CardContent>
            <code className="block rounded bg-muted px-3 py-2 text-xs">
              {claudeConfigPath(os)}
            </code>
          </CardContent>
        </Card>
      )}

      {/* Yapılandırma JSON */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("mcpConfig.configJson")}</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => copy(configJson, "config")}
            >
              {copiedKey === "config" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {t("common.copy")}
            </Button>
            <Button size="sm" variant="outline" onClick={download}>
              <Download className="h-4 w-4" />
              {t("common.download")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded bg-muted px-3 py-2 text-xs">
            {configJson}
          </pre>
        </CardContent>
      </Card>

      {/* Kod örnekleri (OpenAI / Anthropic) */}
      {showCode && (
        <Card>
          <CardHeader>
            <CardTitle>{t("mcpConfig.integrationExamples")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-medium">{t("mcpConfig.getTools")}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copy(getToolsCode, "getTools")}
                >
                  {copiedKey === "getTools" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <pre className="overflow-auto rounded bg-muted px-3 py-2 text-xs">
                {getToolsCode}
              </pre>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-medium">{t("mcpConfig.callTool")}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copy(callToolCode, "callTool")}
                >
                  {copiedKey === "callTool" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <pre className="overflow-auto rounded bg-muted px-3 py-2 text-xs">
                {callToolCode}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Kurulum adımları dizisini locale'e göre döndüren yardımcı hook.
import { useLocale } from "@/contexts/locale-context";
import { getTranslations } from "@/lib/i18n";

function useStepArray(target: TargetPlatform): string[] {
  const { locale } = useLocale();
  const tr = getTranslations(locale).mcpConfig;
  switch (target) {
    case "claude-desktop":
      return [...tr.installationStepsClaude];
    case "n8n":
      return [...tr.installationStepsN8n];
    case "openai":
      return [...tr.installationStepsOpenAI];
    case "anthropic":
      return [...tr.installationStepsAnthropic];
  }
}
