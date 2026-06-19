"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

export interface CredentialRow {
  id: string;
  credentialType: string;
  keyName: string;
  keyValueMasked: string;
}

type DialogMode =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; credential: CredentialRow };

export function CredentialsPanel({
  integrationId,
  credentials,
}: {
  integrationId: string;
  credentials: CredentialRow[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<DialogMode>({ kind: "closed" });
  const [submitting, setSubmitting] = useState(false);
  const [credentialType, setCredentialType] = useState("bearer");
  const [keyName, setKeyName] = useState("");
  const [keyValue, setKeyValue] = useState("");

  const isEdit = mode.kind === "edit";

  function openCreate() {
    setCredentialType("bearer");
    setKeyName("");
    setKeyValue("");
    setMode({ kind: "create" });
  }

  function openEdit(credential: CredentialRow) {
    setCredentialType(credential.credentialType);
    setKeyName(credential.keyName);
    setKeyValue("");
    setMode({ kind: "edit", credential });
  }

  function closeDialog() {
    setMode({ kind: "closed" });
  }

  async function handleSubmit() {
    if (!keyName) {
      toast.error("Anahtar adı zorunludur");
      return;
    }
    if (!isEdit && !keyValue) {
      toast.error("Anahtar değeri zorunludur");
      return;
    }
    setSubmitting(true);
    try {
      if (mode.kind === "edit") {
        await api.put(
          `/api/integrations/${integrationId}/credentials/${mode.credential.id}`,
          {
            credentialType,
            keyName,
            // Boş bırakılırsa sunucu mevcut değeri korur.
            keyValue: keyValue || undefined,
          },
        );
        toast.success("Credential güncellendi");
      } else {
        await api.post(`/api/integrations/${integrationId}/credentials`, {
          credentialType,
          keyName,
          keyValue,
        });
        toast.success("Credential eklendi");
      }
      closeDialog();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "İşlem başarısız");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Credential silinsin mi?")) return;
    try {
      await api.del(`/api/integrations/${integrationId}/credentials/${id}`);
      toast.success("Credential silindi");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Silme başarısız");
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex justify-end">
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Credential Ekle
          </Button>
        </div>

        <Dialog
          open={mode.kind !== "closed"}
          onOpenChange={(o) => (o ? null : closeDialog())}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEdit ? "Credential Düzenle" : "Yeni Credential"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tür</Label>
                <Select
                  value={credentialType}
                  onValueChange={setCredentialType}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bearer">bearer</SelectItem>
                    <SelectItem value="header">header</SelectItem>
                    <SelectItem value="query">query</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Anahtar Adı</Label>
                <Input
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="X-API-Key veya Authorization"
                />
              </div>
              <div className="space-y-2">
                <Label>Anahtar Değeri</Label>
                <Input
                  type="password"
                  value={keyValue}
                  onChange={(e) => setKeyValue(e.target.value)}
                  placeholder={
                    isEdit
                      ? "Değiştirmemek için boş bırakın"
                      : "Gizli değer (şifreli saklanır)"
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={submitting}>
                Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {credentials.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Henüz credential yok.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tür</TableHead>
                <TableHead>Anahtar Adı</TableHead>
                <TableHead>Değer (maskeli)</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credentials.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Badge variant="outline">{c.credentialType}</Badge>
                  </TableCell>
                  <TableCell>{c.keyName}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {c.keyValueMasked}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(c)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(c.id)}
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
