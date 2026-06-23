"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "@/lib/client/api";
import { useTranslation } from "@/hooks/use-translation";
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

const createFormSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t("validation.nameRequired")),
    description: z.string().optional(),
    baseUrlProd: z.string().url(t("validation.invalidUrl")),
    baseUrlTest: z.string().url(t("validation.invalidUrl")),
    activeEnv: z.enum(["prod", "test"]),
  });

type FormValues = {
  name: string;
  description?: string;
  baseUrlProd: string;
  baseUrlTest: string;
  activeEnv: "prod" | "test";
};

interface Props {
  integrationId?: string;
  defaultValues?: Partial<FormValues>;
}

export function IntegrationForm({ integrationId, defaultValues }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const isEdit = Boolean(integrationId);
  const formSchema = createFormSchema(t);

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
        toast.success(t("integrations.updated"));
        router.push(`/integrations/${integrationId}`);
      } else {
        const { id } = await api.post<{ id: string }>(
          "/api/integrations",
          values,
        );
        toast.success(t("integrations.created"));
        router.push(`/integrations/${id}`);
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t("integrations.name")}</Label>
        <Input id="name" {...register("name")} placeholder="Order API" />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("integrations.description")}</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder={t("integrationForm.descriptionPlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="baseUrlProd">{t("integrationForm.baseUrlProd")}</Label>
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
        <Label htmlFor="baseUrlTest">{t("integrationForm.baseUrlTest")}</Label>
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
          <Label>{t("integrations.activeEnv")}</Label>
          <Select
            value={activeEnv}
            onValueChange={(v) => setValue("activeEnv", v as "prod" | "test")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="test">{t("integrations.test")}</SelectItem>
              <SelectItem value="prod">{t("integrations.production")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isEdit ? t("common.edit") : t("common.create")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
