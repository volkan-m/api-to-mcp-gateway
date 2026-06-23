"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileUp, Link2, Zap } from "lucide-react";
import { api } from "@/lib/client/api";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface SpecRow {
  id: string;
  format: string;
  title: string | null;
  version: string | null;
}

export function SpecsPanel({
  integrationId,
  specs,
}: {
  integrationId: string;
  specs: SpecRow[];
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleUpload() {
    if (!content.trim()) {
      toast.error(t("validation.required"));
      return;
    }
    setBusy(true);
    try {
      await api.post(`/api/integrations/${integrationId}/specs/upload`, {
        content,
      });
      toast.success(t("specs.uploaded"));
      setContent("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("specs.operationFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload() {
    if (!url.trim()) {
      toast.error(t("validation.required"));
      return;
    }
    setBusy(true);
    try {
      await api.post(`/api/integrations/${integrationId}/specs/url`, { url });
      toast.success(t("specs.uploaded"));
      setUrl("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("specs.operationFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function handleExtract(specId: string) {
    setBusy(true);
    try {
      const res = await api.post<{ count: number }>(
        `/api/integrations/${integrationId}/specs/${specId}/extract`,
      );
      toast.success(t("specs.extracted"));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("specs.operationFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="upload">
            <TabsList>
              <TabsTrigger value="upload">
                <FileUp className="h-4 w-4" /> {t("specs.upload")}
              </TabsTrigger>
              <TabsTrigger value="url">
                <Link2 className="h-4 w-4" /> {t("specs.upload")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="space-y-2">
              <Label>{t("specs.file")}</Label>
              <Textarea
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder='{ "openapi": "3.0.0", ... }'
                className="font-mono text-xs"
              />
              <Button onClick={handleUpload} disabled={busy}>
                {t("specs.upload")}
              </Button>
            </TabsContent>
            <TabsContent value="url" className="space-y-2">
              <Label>{t("specs.upload")}</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/swagger.json"
              />
              <Button onClick={handleDownload} disabled={busy}>
                {t("specs.upload")}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {specs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("specs.empty")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("specs.title")}</TableHead>
                  <TableHead>{t("specs.format")}</TableHead>
                  <TableHead>{t("specs.version")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {specs.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.title || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{s.format}</Badge>
                    </TableCell>
                    <TableCell>{s.version || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => handleExtract(s.id)}
                      >
                        <Zap className="h-4 w-4" />
                        {t("specs.extract")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
