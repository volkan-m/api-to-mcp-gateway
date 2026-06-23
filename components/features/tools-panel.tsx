"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/client/api";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import type { EndpointRow } from "./endpoints-panel";

export interface ToolRow {
  id: string;
  toolName: string;
  toolDescription: string | null;
  enabled: boolean;
  endpointId: string;
  endpointLabel: string;
}

export function ToolsPanel({
  integrationId,
  tools,
  endpoints,
}: {
  integrationId: string;
  tools: ToolRow[];
  endpoints: EndpointRow[];
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [endpointId, setEndpointId] = useState("");
  const [toolName, setToolName] = useState("");
  const [toolDescription, setToolDescription] = useState("");

  async function upsert(payload: {
    endpointId: string;
    toolName: string;
    toolDescription?: string;
    enabled: boolean;
  }) {
    await api.post(`/api/integrations/${integrationId}/tools`, payload);
  }

  async function handleCreate() {
    if (!endpointId || !toolName) {
      toast.error(t("validation.required"));
      return;
    }
    setBusy(true);
    try {
      await upsert({ endpointId, toolName, toolDescription, enabled: true });
      toast.success(t("tools.saved"));
      setOpen(false);
      setEndpointId("");
      setToolName("");
      setToolDescription("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("tools.operationFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle(tool: ToolRow, enabled: boolean) {
    try {
      await upsert({
        endpointId: tool.endpointId,
        toolName: tool.toolName,
        toolDescription: tool.toolDescription ?? undefined,
        enabled,
      });
      toast.success(t("tools.saved"));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("tools.operationFailed"));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("tools.deleteConfirm"))) return;
    try {
      await api.del(`/api/integrations/${integrationId}/tools/${id}`);
      toast.success(t("tools.deleted"));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("tools.operationFailed"));
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={endpoints.length === 0}>
                <Plus className="h-4 w-4" />
                {t("tools.add")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("tools.title")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("tools.endpoint")}</Label>
                  <Select value={endpointId} onValueChange={setEndpointId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("validation.required")} />
                    </SelectTrigger>
                    <SelectContent>
                      {endpoints.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.method} {e.path}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("tools.toolName")}</Label>
                  <Input
                    value={toolName}
                    onChange={(e) => setToolName(e.target.value)}
                    placeholder="getOrder"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("tools.toolDescription")}</Label>
                  <Input
                    value={toolDescription}
                    onChange={(e) => setToolDescription(e.target.value)}
                    placeholder="Sipariş detayını getirir"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={busy}>
                  {t("common.save")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {tools.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("tools.empty")}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tools.toolName")}</TableHead>
                <TableHead>{t("tools.endpoint")}</TableHead>
                <TableHead>{t("tools.enabled")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tools.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.toolName}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {t.endpointLabel}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={t.enabled}
                      onCheckedChange={(v) => handleToggle(t, v)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(t.id)}
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
