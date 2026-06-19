import { randomUUID } from "crypto";

// Hafif, bellek-içi Prisma taklidi. Servis testlerinin gerçekçi
// upsert/findUnique/benzersizlik davranışına ihtiyacı vardır (özellikle
// endpoint çıkarma idempotansı ve benzersizlik değişmezleri için).
//
// Yalnızca servislerin kullandığı modeller/operasyonlar desteklenir:
//   apiIntegration, apiCredential, apiSpec, endpoint, toolSelection
//
// Kullanım:
//   const db = createMockPrisma();
//   vi.mock("@/lib/db", () => ({ prisma: db }));  // (factory hoisting'e dikkat)

type Row = Record<string, any>;

interface CompoundKeyConfig {
  // örn: { apiIntegrationId_method_path: ["apiIntegrationId", "method", "path"] }
  [compoundName: string]: string[];
}

class ModelStore {
  rows: Row[] = [];
  constructor(
    private uniqueFields: string[] = ["id"],
    private compoundKeys: CompoundKeyConfig = {},
  ) {}

  private matchWhere(row: Row, where: Row): boolean {
    return Object.entries(where).every(([k, v]) => {
      // Compound key nesnesi (örn. apiIntegrationId_method_path: {...})
      if (this.compoundKeys[k] && v && typeof v === "object") {
        return this.compoundKeys[k].every((field) => row[field] === v[field]);
      }
      return row[k] === v;
    });
  }

  private findRow(where: Row): Row | undefined {
    return this.rows.find((r) => this.matchWhere(r, where));
  }

  async findUnique({ where }: { where: Row }) {
    return this.findRow(where) ?? null;
  }

  async findFirst({ where = {} }: { where?: Row } = {}) {
    return this.rows.find((r) => this.matchWhere(r, where)) ?? null;
  }

  async findMany({
    where = {},
  }: { where?: Row; orderBy?: unknown; include?: unknown; select?: unknown } = {}) {
    return this.rows.filter((r) => this.matchWhere(r, where)).map((r) => ({ ...r }));
  }

  async create({ data }: { data: Row }) {
    const row: Row = {
      id: data.id ?? randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
    // Benzersizlik kontrolü
    for (const field of this.uniqueFields) {
      if (field === "id") continue;
      if (this.rows.some((r) => r[field] === row[field] && row[field] !== undefined)) {
        throw new Error(`Unique constraint failed on ${field}`);
      }
    }
    this.rows.push(row);
    return { ...row };
  }

  async update({ where, data }: { where: Row; data: Row }) {
    const row = this.findRow(where);
    if (!row) throw new Error("Record to update not found");
    Object.assign(row, data, { updatedAt: new Date() });
    return { ...row };
  }

  async upsert({
    where,
    create,
    update,
  }: {
    where: Row;
    create: Row;
    update: Row;
  }) {
    const existing = this.findRow(where);
    if (existing) {
      Object.assign(existing, update, { updatedAt: new Date() });
      return { ...existing };
    }
    return this.create({ data: create });
  }

  async delete({ where }: { where: Row }) {
    const idx = this.rows.findIndex((r) => this.matchWhere(r, where));
    if (idx === -1) throw new Error("Record to delete does not exist");
    const [removed] = this.rows.splice(idx, 1);
    return { ...removed };
  }

  // include desteği için: testler gerekirse manuel olarak ilişki kurar.
}

export interface MockPrisma {
  apiIntegration: ModelStore;
  apiCredential: ModelStore;
  apiSpec: ModelStore;
  endpoint: ModelStore;
  toolSelection: ModelStore;
  _reset: () => void;
}

export function createMockPrisma(): MockPrisma {
  const apiIntegration = new ModelStore(["id", "name"]);
  const apiCredential = new ModelStore(["id"]);
  const apiSpec = new ModelStore(["id"]);
  const endpoint = new ModelStore(["id"], {
    apiIntegrationId_method_path: ["apiIntegrationId", "method", "path"],
  });
  const toolSelection = new ModelStore(["id"], {
    apiIntegrationId_endpointId: ["apiIntegrationId", "endpointId"],
  });

  return {
    apiIntegration,
    apiCredential,
    apiSpec,
    endpoint,
    toolSelection,
    _reset() {
      apiIntegration.rows = [];
      apiCredential.rows = [];
      apiSpec.rows = [];
      endpoint.rows = [];
      toolSelection.rows = [];
    },
  };
}
