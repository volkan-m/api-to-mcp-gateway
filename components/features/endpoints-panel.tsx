"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface EndpointRow {
  id: string;
  method: string;
  path: string;
  summary: string | null;
  description?: string | null;
  externalUrlProd?: string | null;
  externalUrlTest?: string | null;
  inputSchema?: string;
  outputSchema?: string | null;
}

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

const METHOD_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  GET: "secondary",
  POST: "default",
  PUT: "outline",
  PATCH: "outline",
  DELETE: "destructive",
};

const DEFAULT_INPUT_SCHEMA = `{
  "type": "object",
  "properties": {},
  "parameters": []
}`;

type DialogMode =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; endpoint: EndpointRow };

interface FormState {
  method: string;
  path: string;
  summary: string;
  description: string;
  externalUrlProd: string;
  externalUrlTest: string;
  inputSchema: string;
  outputSchema: string;
}

const EMPTY_FORM: FormState = {
  method: "GET",
  path: "",
  summary: "",
  description: "",
  externalUrlProd: "",
  externalUrlTest: "",
  inputSchema: DEFAULT_INPUT_SCHEMA,
  outputSchema: "",
};

export function EndpointsPanel({
  integrationId,
  endpoints,
}: {
  integrationId: string;
  endpoints: EndpointRow[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<DialogMode>({ kind: "closed" });
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const isEdit = mode.kind === "edit";

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setMode({ kind: "create" });
  }

  function openEdit(endpoint: EndpointRow) {
    setForm({
      method: endpoint.method,
      path: endpoint.path,
      summary: endpoint.summary ?? "",
      description: endpoint.description ?? "",
      externalUrlProd: endpoint.externalUrlProd ?? "",
      externalUrlTest: endpoint.externalUrlTest ?? "",
      inputSchema: endpoint.inputSchema || DEFAULT_INPUT_SCHEMA,
      outputSchema: endpoint.outputSchema ?? "",
    });
    setMode({ kind: "edit", endpoint });
  }

  function closeDialog() {
    setMode({ kind: "closed" });
  }

  async function handleSubmit() {
    if (!form.path.trim()) {
      toast.error("Path zorunludur");
      return;
    }
    // inputSchema JSON doğrulaması (sunucu da doğruluyor; burada erken uyarı).
    try {
      JSON.parse(form.inputSchema);
    } catch {
      toast.error("inputSchema geçerli bir JSON olmalıdır");
      return;
    }
    if (form.outputSchema.trim()) {
      try {
        JSON.parse(form.outputSchema);
      } catch {
        toast.error("outputSchema geçerli bir JSON olmalıdır");
        return;
      }
    }

    const payload = {
      method: form.method,
      path: form.path.trim(),
      summary: form.summary || null,
      description: form.description || null,
      externalUrlProd: form.externalUrlProd || null,
      externalUrlTest: form.externalUrlTest || null,
      inputSchema: form.inputSchema,
      outputSchema: form.outputSchema || null,
    };

    setBusy(true);
    try {
      if (mode.kind === "edit") {
        await api.put(
          `/api/integrations/${integrationId}/endpoints/${mode.endpoint.id}`,
          payload,
        );
        toast.success("Endpoint güncellendi");
      } else {
        await api.post(`/api/integrations/${integrationId}/endpoints`, payload);
        toast.success("Endpoint eklendi");
      }
      closeDialog();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "İşlem başarısız");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Endpoint silinsin mi?")) return;
    setBusy(true);
    try {
      await api.del(`/api/integrations/${integrationId}/endpoints/${id}`);
      toast.success("Endpoint silindi");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Silme başarısız");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex justify-end">
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Endpoint Ekle
          </Button>
        </div>

        <Dialog
          open={mode.kind !== "closed"}
          onOpenChange={(o) => (o ? null : closeDialog())}
        >
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isEdit ? "Endpoint Düzenle" : "Yeni Endpoint"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-[140px_1fr] gap-3">
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Select
                    value={form.method}
                    onValueChange={(v) => set("method", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Path</Label>
                  <Input
                    value={form.path}
                    onChange={(e) => set("path", e.target.value)}
                    placeholder="/users/{id}"
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Özet</Label>
                <Input
                  value={form.summary}
                  onChange={(e) => set("summary", e.target.value)}
                  placeholder="Kısa açıklama"
                />
              </div>

              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>External URL (prod)</Label>
                  <Input
                    value={form.externalUrlProd}
                    onChange={(e) => set("externalUrlProd", e.target.value)}
                    placeholder="opsiyonel"
                  />
                </div>
                <div className="space-y-2">
                  <Label>External URL (test)</Label>
                  <Input
                    value={form.externalUrlTest}
                    onChange={(e) => set("externalUrlTest", e.target.value)}
                    placeholder="opsiyonel"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>inputSchema (JSON)</Label>
                <Textarea
                  value={form.inputSchema}
                  onChange={(e) => set("inputSchema", e.target.value)}
                  rows={8}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label>outputSchema (JSON, opsiyonel)</Label>
                <Textarea
                  value={form.outputSchema}
                  onChange={(e) => set("outputSchema", e.target.value)}
                  rows={4}
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={busy}>
                Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {endpoints.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Henüz endpoint yok. Spec&apos;lerden endpoint çıkarın veya manuel ekleyin.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Özet</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {endpoints.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <Badge variant={METHOD_VARIANT[e.method] ?? "outline"}>
                      {e.method}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{e.path}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.summary || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={busy}
                      onClick={() => openEdit(e)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={busy}
                      onClick={() => handleDelete(e.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
