import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "@modelcontextprotocol/sdk"],
};

export default nextConfig;
