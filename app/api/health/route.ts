import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Eski C# StartUpController (/startup/init) karşılığı: basit bir liveness ucu.
// Orijinal uç yalnızca OpenTelemetry metrik sayacını artırıp 200 OK dönüyordu;
// metrik altyapısı (Pars.Core.Monitoring) bu birleşik projeye taşınmadığından
// burada sade bir sağlık (liveness) yanıtı verilir.
export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
