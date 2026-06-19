"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/client/api";
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
      toast.error("Endpoint ve tool adı zorunludur");
      return;
    }
    setBusy(true);
    try {
      await upsert({ endpointId, toolName, toolDescription, enabled: true });
      toast.success("Tool kaydedildi");
      setOpen(false);
      setEndpointId("");
      setToolName("");
      setToolDescription("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kaydetme başarısız");
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
      toast.success(enabled ? "Tool etkinleştirildi" : "Tool devre dışı");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Güncelleme başarısız");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tool seçimi silinsin mi?")) return;
    try {
      await api.del(`/api/integrations/${integrationId}/tools/${id}`);
      toast.success("Tool silindi");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Silme başarısız");
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
                Tool Ekle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Endpoint'i Tool'a Dönüştür</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Endpoint</Label>
                  <Select value={endpointId} onValueChange={setEndpointId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Endpoint seçin" />
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
                  <Label>Tool Adı</Label>
                  <Input
                    value={toolName}
                    onChange={(e) => setToolName(e.target.value)}
                    placeholder="getOrder"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Açıklama</Label>
                  <Input
                    value={toolDescription}
                    onChange={(e) => setToolDescription(e.target.value)}
                    placeholder="Sipariş detayını getirir"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={busy}>
                  Kaydet
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {tools.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Henüz tool yok. Önce endpoint çıkarın, sonra tool'a dönüştürün.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool Adı</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Etkin</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
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
