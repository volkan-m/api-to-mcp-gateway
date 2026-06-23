"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/client/api";
import { useTranslation } from "@/hooks/use-translation";
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
  const { t } = useTranslation();
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
      toast.error(t("credentials.keyNameRequired"));
      return;
    }
    if (!isEdit && !keyValue) {
      toast.error(t("credentials.keyValueRequired"));
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
            keyValue: keyValue || undefined,
          },
        );
        toast.success(t("credentials.updated"));
      } else {
        await api.post(`/api/integrations/${integrationId}/credentials`, {
          credentialType,
          keyName,
          keyValue,
        });
        toast.success(t("credentials.created"));
      }
      closeDialog();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("credentials.operationFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("credentials.deleteConfirm"))) return;
    try {
      await api.del(`/api/integrations/${integrationId}/credentials/${id}`);
      toast.success(t("credentials.deleted"));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("credentials.deleteFailed"));
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex justify-end">
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t("credentials.add")}
          </Button>
        </div>

        <Dialog
          open={mode.kind !== "closed"}
          onOpenChange={(o) => (o ? null : closeDialog())}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEdit ? t("credentials.edit") : t("credentials.new")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("credentials.type")}</Label>
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
                <Label>{t("credentials.keyName")}</Label>
                <Input
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder={t("credentials.placeholder")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("credentials.keyValue")}</Label>
                <Input
                  type="password"
                  value={keyValue}
                  onChange={(e) => setKeyValue(e.target.value)}
                  placeholder={
                    isEdit
                      ? t("credentials.placeholderEdit")
                      : t("credentials.placeholderCreate")
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={submitting}>
                {t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {credentials.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("credentials.empty")}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("credentials.type")}</TableHead>
                <TableHead>{t("credentials.keyName")}</TableHead>
                <TableHead>{t("credentials.value")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
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
