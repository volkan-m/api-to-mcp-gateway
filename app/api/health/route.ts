import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Equivalent of old C# StartUpController (/startup/init): simple liveness endpoint.
// The original endpoint only incremented an OpenTelemetry metric counter and returned 200 OK;
// since the metric infrastructure (Pars.Core.Monitoring) was not ported to this consolidated
// project, a simple liveness response is returned here.
export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
