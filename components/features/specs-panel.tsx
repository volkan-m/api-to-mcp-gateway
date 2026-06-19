"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileUp, Link2, Zap } from "lucide-react";
import { api } from "@/lib/client/api";
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
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleUpload() {
    if (!content.trim()) {
      toast.error("Spec içeriği boş olamaz");
      return;
    }
    setBusy(true);
    try {
      await api.post(`/api/integrations/${integrationId}/specs/upload`, {
        content,
      });
      toast.success("Spec yüklendi");
      setContent("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Yükleme başarısız");
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload() {
    if (!url.trim()) {
      toast.error("URL girin");
      return;
    }
    setBusy(true);
    try {
      await api.post(`/api/integrations/${integrationId}/specs/url`, { url });
      toast.success("Spec URL'den indirildi");
      setUrl("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "İndirme başarısız");
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
      toast.success(`${res.count} endpoint çıkarıldı`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Çıkarma başarısız");
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
                <FileUp className="h-4 w-4" /> İçerik Yükle
              </TabsTrigger>
              <TabsTrigger value="url">
                <Link2 className="h-4 w-4" /> URL'den İndir
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="space-y-2">
              <Label>OpenAPI / Swagger içeriği (JSON veya YAML)</Label>
              <Textarea
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder='{ "openapi": "3.0.0", ... }'
                className="font-mono text-xs"
              />
              <Button onClick={handleUpload} disabled={busy}>
                Yükle
              </Button>
            </TabsContent>
            <TabsContent value="url" className="space-y-2">
              <Label>Spec URL'i</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/swagger.json"
              />
              <Button onClick={handleDownload} disabled={busy}>
                İndir
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {specs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Henüz spec yok.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Versiyon</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
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
                        Endpoint Çıkar
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
