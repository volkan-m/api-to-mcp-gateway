"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/client/api";
import { useTranslation } from "@/hooks/use-translation";
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
  const { t } = useTranslation();
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
      toast.error(t("endpoints.pathRequired"));
      return;
    }
    try {
      JSON.parse(form.inputSchema);
    } catch {
      toast.error(t("validation.required"));
      return;
    }
    if (form.outputSchema.trim()) {
      try {
        JSON.parse(form.outputSchema);
      } catch {
        toast.error(t("validation.required"));
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
        toast.success(t("endpoints.updated"));
      } else {
        await api.post(`/api/integrations/${integrationId}/endpoints`, payload);
        toast.success(t("endpoints.created"));
      }
      closeDialog();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("endpoints.operationFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("endpoints.deleteConfirm"))) return;
    setBusy(true);
    try {
      await api.del(`/api/integrations/${integrationId}/endpoints/${id}`);
      toast.success(t("endpoints.deleted"));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("endpoints.operationFailed"));
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
            {t("endpoints.add")}
          </Button>
        </div>

        <Dialog
          open={mode.kind !== "closed"}
          onOpenChange={(o) => (o ? null : closeDialog())}
        >
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isEdit ? t("endpoints.edit") : t("endpoints.new")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-[140px_1fr] gap-3">
                <div className="space-y-2">
                  <Label>{t("endpoints.method")}</Label>
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
                  <Label>{t("endpoints.path")}</Label>
                  <Input
                    value={form.path}
                    onChange={(e) => set("path", e.target.value)}
                    placeholder={t("endpoints.pathPlaceholder")}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("endpoints.summary")}</Label>
                <Input
                  value={form.summary}
                  onChange={(e) => set("summary", e.target.value)}
                  placeholder={t("endpoints.summaryPlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("endpoints.description")}</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={2}
                  placeholder={t("endpoints.descriptionPlaceholder")}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t("endpoints.externalUrlProd")}</Label>
                  <Input
                    value={form.externalUrlProd}
                    onChange={(e) => set("externalUrlProd", e.target.value)}
                    placeholder={t("validation.required")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("endpoints.externalUrlTest")}</Label>
                  <Input
                    value={form.externalUrlTest}
                    onChange={(e) => set("externalUrlTest", e.target.value)}
                    placeholder={t("validation.required")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("endpoints.requestSchema")}</Label>
                <Textarea
                  value={form.inputSchema}
                  onChange={(e) => set("inputSchema", e.target.value)}
                  rows={8}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label>{t("endpoints.responseSchema")}</Label>
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
                {t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {endpoints.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("endpoints.empty")}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("endpoints.method")}</TableHead>
                <TableHead>{t("endpoints.path")}</TableHead>
                <TableHead>{t("endpoints.summary")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
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
