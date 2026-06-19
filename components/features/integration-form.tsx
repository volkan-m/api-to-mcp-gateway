"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(1, "İsim zorunludur"),
  description: z.string().optional(),
  baseUrlProd: z.string().url("Geçerli bir URL girin"),
  baseUrlTest: z.string().url("Geçerli bir URL girin"),
  activeEnv: z.enum(["prod", "test"]),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  integrationId?: string;
  defaultValues?: Partial<FormValues>;
}

export function IntegrationForm({ integrationId, defaultValues }: Props) {
  const router = useRouter();
  const isEdit = Boolean(integrationId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      baseUrlProd: defaultValues?.baseUrlProd ?? "",
      baseUrlTest: defaultValues?.baseUrlTest ?? "",
      activeEnv: defaultValues?.activeEnv ?? "test",
    },
  });

  const activeEnv = watch("activeEnv");

  async function onSubmit(values: FormValues) {
    try {
      if (isEdit) {
        await api.put(`/api/integrations/${integrationId}`, values);
        toast.success("Entegrasyon güncellendi");
        router.push(`/integrations/${integrationId}`);
      } else {
        const { id } = await api.post<{ id: string }>(
          "/api/integrations",
          values,
        );
        toast.success("Entegrasyon oluşturuldu");
        router.push(`/integrations/${id}`);
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "İşlem başarısız");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">İsim</Label>
        <Input id="name" {...register("name")} placeholder="Sipariş API" />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Açıklama</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Entegrasyon açıklaması (opsiyonel)"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="baseUrlProd">Production Base URL</Label>
        <Input
          id="baseUrlProd"
          {...register("baseUrlProd")}
          placeholder="https://api.example.com"
        />
        {errors.baseUrlProd && (
          <p className="text-sm text-destructive">
            {errors.baseUrlProd.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="baseUrlTest">Test Base URL</Label>
        <Input
          id="baseUrlTest"
          {...register("baseUrlTest")}
          placeholder="https://api-test.example.com"
        />
        {errors.baseUrlTest && (
          <p className="text-sm text-destructive">
            {errors.baseUrlTest.message}
          </p>
        )}
      </div>

      {isEdit && (
        <div className="space-y-2">
          <Label>Aktif Ortam</Label>
          <Select
            value={activeEnv}
            onValueChange={(v) => setValue("activeEnv", v as "prod" | "test")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="test">test</SelectItem>
              <SelectItem value="prod">prod</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isEdit ? "Güncelle" : "Oluştur"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          İptal
        </Button>
      </div>
    </form>
  );
}
