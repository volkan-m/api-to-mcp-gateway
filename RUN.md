# Running Locally / Yerel Çalıştırma

[English](#english) | [Türkçe](#türkçe)

---

<a name="english"></a>
## English

### Local Development (Without Docker)

This guide walks through running the project in development mode using a locally installed PostgreSQL instance — no Docker required.

#### Prerequisites

- Node.js 18+ (Node.js 22 recommended)
- PostgreSQL 14+
- Git

#### Step 1 — Clone and Install

```bash
git clone https://github.com/volkan-m/api-to-mcp-gateway.git
cd api-to-mcp-gateway
npm install
```

#### Step 2 — Create the Database

```bash
createdb -U postgres -h localhost -p 5432 mcp_gateway
```

Or using `psql`:

```bash
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE mcp_gateway;"
```

#### Step 3 — Configure Environment

Copy the example file and edit the values:

```bash
cp ENV.EXAMPLE .env
```

Minimum required values in `.env`:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mcp_gateway?schema=public"
ENCRYPTION_KEY="any_32_character_string_here___!"
```

> `AUTH_TOKEN` — leave blank to disable authentication in development mode.

#### Step 4 — Generate Prisma Client and Apply Schema

```bash
npx prisma generate
npx prisma migrate dev --name init
```

For a quick setup without migration history:

```bash
npx prisma db push
```

#### Step 5 — Start the Development Server

```bash
npm run dev
```

The application will be available at:

| URL | Description |
|---|---|
| `http://localhost:3000` | Home |
| `http://localhost:3000/integrations` | Management dashboard |
| `http://localhost:3000/api/integrations` | REST API |
| `POST http://localhost:3000/api/mcp` | MCP HTTP transport (`X-Integration-Id` header required) |

#### Step 6 — Quick Verification

```bash
# List integrations (no header needed if AUTH_TOKEN is blank)
curl http://localhost:3000/api/integrations
```

Returns `[]` on first run. Use `http://localhost:3000/integrations/new` to add your first integration.

---

#### Claude Desktop (stdio) Setup

Add the following to your `claude_desktop_config.json` (replace the path with your actual project directory):

```json
{
  "mcpServers": {
    "api-to-mcp": {
      "command": "npm",
      "args": ["run", "mcp:stdio"],
      "cwd": "/path/to/api-to-mcp-gateway",
      "env": { "INTEGRATION_ID": "<your-integration-id>" }
    }
  }
}
```

---

#### Useful Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build (includes prisma generate) |
| `npm run typecheck` | TypeScript type check |
| `npx prisma studio` | Open visual database browser |
| `npm run mcp:stdio` | Start stdio MCP server (for Claude Desktop) |

---

#### Troubleshooting

| Symptom | Fix |
|---|---|
| `P1000` / authentication error | Check `DATABASE_URL` user/password in `.env` |
| `P1001` connection refused | Make sure PostgreSQL is running |
| `database "mcp_gateway" does not exist` | Run the `createdb` command in Step 2 |
| `prisma generate` warning | Run `npx prisma generate` |
| Port 5432 in use | Another PostgreSQL instance may be running; check active services |
| `/api/**` returns 401 | Add `X-API-Key: <AUTH_TOKEN>` header if `AUTH_TOKEN` is set in `.env` |

---

<a name="türkçe"></a>
## Türkçe

### Yerel Geliştirme (Docker Olmadan)

Bu rehber, projeyi yerel olarak kurulu bir PostgreSQL veritabanıyla — Docker gerektirmeden — geliştirme ortamında çalıştırma adımlarını anlatır.

#### Gereksinimler

- Node.js 18+ (Node.js 22 önerilir)
- PostgreSQL 14+
- Git

#### Adım 1 — Klonla ve Bağımlılıkları Kur

```bash
git clone https://github.com/volkan-m/api-to-mcp-gateway.git
cd api-to-mcp-gateway
npm install
```

#### Adım 2 — Veritabanını Oluştur

```bash
createdb -U postgres -h localhost -p 5432 mcp_gateway
```

Ya da `psql` ile:

```bash
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE mcp_gateway;"
```

#### Adım 3 — Ortam Değişkenlerini Yapılandır

Örnek dosyayı kopyalayın ve değerleri düzenleyin:

```bash
cp ENV.EXAMPLE .env
```

`.env` içinde en az şu değerlerin dolu olması gerekir:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mcp_gateway?schema=public"
ENCRYPTION_KEY="herhangi_32_karakterlik_bir_deger!"
```

> `AUTH_TOKEN` — geliştirme ortamında kimlik doğrulamayı devre dışı bırakmak için boş bırakın.

#### Adım 4 — Prisma Client'ı Oluştur ve Şemayı Uygula

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Migration geçmişi tutmadan hızlı kurulum için:

```bash
npx prisma db push
```

#### Adım 5 — Geliştirme Sunucusunu Başlat

```bash
npm run dev
```

Uygulama şu adreslerde hazır olacaktır:

| URL | Açıklama |
|---|---|
| `http://localhost:3000` | Ana sayfa |
| `http://localhost:3000/integrations` | Yönetim paneli |
| `http://localhost:3000/api/integrations` | REST API |
| `POST http://localhost:3000/api/mcp` | MCP HTTP endpoint (`X-Integration-Id` header zorunlu) |

#### Adım 6 — Hızlı Doğrulama

```bash
# Entegrasyonları listele (AUTH_TOKEN boşsa header gerekmez)
curl http://localhost:3000/api/integrations
```

İlk kurulumda `[]` döner. İlk entegrasyonunuzu eklemek için `http://localhost:3000/integrations/new` sayfasını kullanın.

---

#### Claude Desktop (stdio) Entegrasyonu

`claude_desktop_config.json` dosyanıza aşağıdaki bloğu ekleyin (yolu kendi proje klasörünüzle değiştirin):

```json
{
  "mcpServers": {
    "api-to-mcp": {
      "command": "npm",
      "args": ["run", "mcp:stdio"],
      "cwd": "/api-to-mcp-gateway/proje/yolu",
      "env": { "INTEGRATION_ID": "<entegrasyon-id>" }
    }
  }
}
```

---

#### Yardımcı Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusunu başlatır |
| `npm run build` | Production build (prisma generate dahil) |
| `npm run typecheck` | TypeScript tip kontrolü |
| `npx prisma studio` | Veritabanını görsel olarak incele |
| `npm run mcp:stdio` | stdio MCP sunucusu (Claude Desktop için) |

---

#### Sorun Giderme

| Belirti | Çözüm |
|---|---|
| `P1000` / kimlik doğrulama hatası | `.env` içindeki `DATABASE_URL` kullanıcı/şifresini kontrol edin |
| `P1001` bağlanılamıyor | PostgreSQL servisinin çalıştığından emin olun |
| `database "mcp_gateway" does not exist` | 2. adımdaki `createdb` komutunu çalıştırın |
| `prisma generate` gerekiyor uyarısı | `npx prisma generate` çalıştırın |
| Port 5432 dolu | Başka bir PostgreSQL örneği çalışıyor olabilir; servisleri kontrol edin |
| `/api/**` 401 dönüyor | `.env` içinde `AUTH_TOKEN` ayarlıysa `X-API-Key: <AUTH_TOKEN>` header'ı ekleyin |
