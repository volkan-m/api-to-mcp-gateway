-- CreateTable
CREATE TABLE "ApiIntegration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "baseUrlProd" TEXT NOT NULL,
    "baseUrlTest" TEXT NOT NULL,
    "activeEnv" TEXT NOT NULL DEFAULT 'test',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiCredential" (
    "id" TEXT NOT NULL,
    "apiIntegrationId" TEXT NOT NULL,
    "credentialType" TEXT NOT NULL,
    "keyName" TEXT NOT NULL,
    "keyValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiSpec" (
    "id" TEXT NOT NULL,
    "apiIntegrationId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "rawContent" TEXT NOT NULL,
    "title" TEXT,
    "version" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Endpoint" (
    "id" TEXT NOT NULL,
    "apiIntegrationId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "externalUrlProd" TEXT,
    "externalUrlTest" TEXT,
    "operationId" TEXT,
    "summary" TEXT,
    "description" TEXT,
    "inputSchema" TEXT NOT NULL,
    "outputSchema" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Endpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolSelection" (
    "id" TEXT NOT NULL,
    "apiIntegrationId" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "toolDescription" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolSelection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiIntegration_name_key" ON "ApiIntegration"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Endpoint_apiIntegrationId_method_path_key" ON "Endpoint"("apiIntegrationId", "method", "path");

-- CreateIndex
CREATE UNIQUE INDEX "ToolSelection_apiIntegrationId_endpointId_key" ON "ToolSelection"("apiIntegrationId", "endpointId");

-- AddForeignKey
ALTER TABLE "ApiCredential" ADD CONSTRAINT "ApiCredential_apiIntegrationId_fkey" FOREIGN KEY ("apiIntegrationId") REFERENCES "ApiIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiSpec" ADD CONSTRAINT "ApiSpec_apiIntegrationId_fkey" FOREIGN KEY ("apiIntegrationId") REFERENCES "ApiIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endpoint" ADD CONSTRAINT "Endpoint_apiIntegrationId_fkey" FOREIGN KEY ("apiIntegrationId") REFERENCES "ApiIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolSelection" ADD CONSTRAINT "ToolSelection_apiIntegrationId_fkey" FOREIGN KEY ("apiIntegrationId") REFERENCES "ApiIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolSelection" ADD CONSTRAINT "ToolSelection_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "Endpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
