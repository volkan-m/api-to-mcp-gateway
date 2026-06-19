"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, ExternalLink } from "lucide-react";
import { api } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface IntegrationRow {
  id: string;
  name: string;
  description: string | null;
  baseUrlProd: string;
  baseUrlTest: string;
  activeEnv: string;
}

export function IntegrationTable({ data }: { data: IntegrationRow[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" entegrasyonu silinsin mi? Bu işlem geri alınamaz.`)) {
      return;
    }
    setDeletingId(id);
    try {
      await api.del(`/api/integrations/${id}`);
      toast.success("Entegrasyon silindi");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Silme başarısız");
    } finally {
      setDeletingId(null);
    }
  }

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Henüz entegrasyon yok. &quot;Yeni Entegrasyon&quot; ile başlayın.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>İsim</TableHead>
          <TableHead>Açıklama</TableHead>
          <TableHead>Aktif Ortam</TableHead>
          <TableHead className="text-right">İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((integration) => (
          <TableRow key={integration.id}>
            <TableCell className="font-medium">
              <Link
                href={`/integrations/${integration.id}`}
                className="flex items-center gap-1 hover:underline"
              >
                {integration.name}
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {integration.description || "—"}
            </TableCell>
            <TableCell>
              <Badge
                variant={integration.activeEnv === "prod" ? "default" : "secondary"}
              >
                {integration.activeEnv}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="icon"
                disabled={deletingId === integration.id}
                onClick={() => handleDelete(integration.id, integration.name)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
