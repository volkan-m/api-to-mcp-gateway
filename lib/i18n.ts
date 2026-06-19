// Çoklu dil (i18n) altyapısı. Orijinal GatewayUI'deki sözlük birebir taşınmıştır.
// İstemci tarafında localStorage ile kalıcı locale, LocaleContext üzerinden okunur.

export type Locale = "en" | "tr";

export const defaultLocale: Locale = "en";
export const locales: Locale[] = ["en", "tr"];

export const translations = {
  en: {
    // Common
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      create: "Create",
      back: "Back",
      next: "Next",
      previous: "Previous",
      copy: "Copy",
      copied: "Copied!",
      download: "Download",
      close: "Close",
      confirm: "Confirm",
      search: "Search",
      filter: "Filter",
      actions: "Actions",
      logout: "Logout",
    },
    // Navigation
    nav: {
      home: "Home",
      integrations: "Integrations",
      newIntegration: "New Integration",
      settings: "Settings",
    },
    // Home
    home: {
      title: "API to MCP Gateway",
      subtitle:
        "Transform your internal APIs into MCP tools and integrate with Claude Desktop",
      manageIntegrations: "Manage Integrations",
      features: {
        fastIntegration: {
          title: "Fast Integration",
          description:
            "Upload your OpenAPI/Swagger spec files and automatically convert them to MCP tools.",
        },
        secureManagement: {
          title: "Secure Management",
          description:
            "Your API credentials are stored encrypted and managed securely.",
        },
        flexibleConfiguration: {
          title: "Flexible Configuration",
          description:
            "Manage production and test environments separately and select the endpoints you want.",
        },
        easyManagement: {
          title: "Easy Management",
          description:
            "Manage and configure your integrations easily with a user-friendly interface.",
        },
      },
    },
    // Integrations
    integrations: {
      title: "API Integrations",
      subtitle: "Manage your internal APIs and convert them to MCP tools",
      newIntegration: "New Integration",
      createNew: "Create New Integration",
      noIntegrations: "No integrations yet",
      noIntegrationsDescription: "Start by creating your first integration",
      createFirst: "Create First Integration",
      production: "Production",
      test: "Test",
      activeEnv: "Active Environment",
      deleteConfirm: 'Are you sure you want to delete the integration "{name}"?',
      loading: "Loading integrations...",
      name: "Name",
      baseUrl: "Base URL",
      createdAt: "Created At",
    },
    // Integration Form
    integrationForm: {
      title: "New API Integration",
      editTitle: "Edit API Integration",
      subtitle: "Create a new API integration and convert it to MCP tools",
      editSubtitle: "Update integration information",
      name: "Integration Name",
      namePlaceholder: "e.g., User Management API",
      description: "Description",
      descriptionPlaceholder: "Brief description of the API",
      baseUrlProd: "Production Base URL",
      baseUrlProdPlaceholder: "https://api.example.com",
      baseUrlTest: "Test Base URL",
      baseUrlTestPlaceholder: "https://test-api.example.com",
      activeEnv: "Active Environment",
      activeEnvProd: "Production",
      activeEnvTest: "Test",
      save: "Save Integration",
      cancel: "Cancel",
      creating: "Creating...",
      saving: "Saving...",
      step1: "Step 1: Basic Information",
      step1Description: "Enter basic information for the integration",
      step2: "Step 2: Upload OpenAPI/Swagger Spec",
      step2Description: "Upload your OpenAPI or Swagger specification file",
      uploadFile: "Upload File",
      or: "or",
      provideUrl: "Provide URL",
      fetchFromUrl: "Fetch from URL",
      specUrl: "Spec URL",
      specUrlPlaceholder: "https://api.example.com/swagger.json",
      fetch: "Fetch",
      uploading: "Uploading...",
      fetching: "Fetching...",
      uploadAndExtract: "Upload Spec and Extract Endpoints",
      success: "Spec uploaded successfully",
      error: "Failed to upload spec",
      notFound: "Integration not found",
    },
    // Endpoints
    endpoints: {
      title: "Manage Endpoints",
      subtitle: "Select endpoints to use as MCP tools",
      noEndpoints: "No endpoints found",
      noEndpointsDescription: "Upload an OpenAPI/Swagger spec to extract endpoints",
      noEndpointsMessage: "No endpoints found yet. Please upload API spec file first.",
      selectAll: "Select All",
      deselectAll: "Deselect All",
      save: "Save Selection",
      saveSuccess: "Tool selections saved!",
      toolName: "Tool Name",
      toolDescription: "Tool Description",
      toolNamePlaceholder: "Tool Name",
      toolDescriptionPlaceholder: "Tool Description",
      method: "Method",
      path: "Path",
      summary: "Summary",
      enabled: "Enabled",
      manageEndpoints: "Manage Endpoints",
      addEndpoint: "Add Endpoint",
      editEndpoint: "Edit Endpoint",
      deleteEndpoint: "Delete Endpoint",
      deleteConfirm: "Are you sure you want to delete this endpoint?",
      methodPlaceholder: "GET, POST, PUT, PATCH, DELETE",
      pathPlaceholder: "/api/users",
      summaryPlaceholder: "Brief description",
      descriptionPlaceholder: "Detailed description",
      requestSchema: "Request Schema (JSON)",
      responseSchema: "Response Schema (JSON)",
      requestSchemaPlaceholder: '{"type": "object", "properties": {...}}',
      responseSchemaPlaceholder: '{"type": "object", "properties": {...}}',
      create: "Create",
      update: "Update",
      cancel: "Cancel",
      created: "Endpoint created successfully",
      updated: "Endpoint updated successfully",
      deleted: "Endpoint deleted successfully",
      error: "Failed to manage endpoint",
      selectedEndpoints: "Selected Endpoints (MCP Tools)",
      selectedEndpointsDescription:
        "These endpoints are enabled as MCP tools and can be used in Claude Desktop",
      availableEndpoints: "Available Endpoints",
      availableEndpointsDescription: "Select endpoints to enable as MCP tools",
      searchPlaceholder: "Search endpoints by method, path, summary...",
      searchResults: "Found {count} of {total} endpoints",
      noSearchResults: "No endpoints found matching your search",
      useExternalUrl: "Use a full URL of a different application (instead of baseUrl)",
      useExternalUrlHint:
        "The full URL is used instead of the path. The matching URL is called based on the environment (prod/test).",
      externalUrlProd: "External URL (Production)",
      externalUrlTest: "External URL (Test)",
    },
    // MCP Config
    mcpConfig: {
      title: "Integration Configuration",
      subtitle: "Copy or download the configuration for your platform",
      platformSelection: "Platform Selection",
      targetPlatform: "Target Platform",
      os: "Operating System",
      language: "Programming Language",
      installationSteps: "Installation Steps",
      configJson: "Configuration (JSON)",
      configFileLocation: "Config File Location",
      forPlatform: "for {platform}",
      otherPlatforms: "Other platforms",
      windows: "Windows",
      macos: "macOS",
      linux: "Linux",
      claudeDesktop: "Claude Desktop",
      n8n: "n8n",
      openai: "OpenAI",
      anthropic: "Anthropic",
      python: "Python",
      javascript: "JavaScript",
      endpoints: "Endpoints",
      authentication: "Authentication",
      exampleRequests: "Example Requests",
      integrationExamples: "Integration Examples",
      getTools: "Get Tools",
      callTool: "Call Tool",
      copyCode: "Copy Code",
      httpEndpoint: "HTTP Endpoint",
      integrationIdHeader: "X-Integration-Id header is required in requests.",
      configNotFound: "Config not found",
      errorTitle: "Error",
      errorSubtitle: "An error occurred while loading the configuration",
      installationStepsClaude: [
        "Open Claude Desktop application",
        "Go to Settings menu",
        "Find Developer Settings section",
        "Copy the JSON configuration below",
        "Add to Claude Desktop config file",
        "Restart Claude Desktop",
      ],
      installationStepsN8n: [
        "Open n8n and create a new workflow",
        "Add HTTP Request node",
        "Call tools using the endpoint below",
        "Add API Key as header (X-API-Key)",
        "Test and save the workflow",
      ],
      installationStepsOpenAI: [
        "Get the tool list with listTools via the HTTP endpoint",
        "Convert tools to OpenAI function format",
        "Send tools to the OpenAI API",
        "Proxy tool calls back to the gateway with callTool",
        "Send results back to OpenAI",
      ],
      installationStepsAnthropic: [
        "Get the tool list with listTools via the HTTP endpoint",
        "Convert tools to Anthropic tool format",
        "Send tools to the Anthropic API",
        "Proxy tool calls back to the gateway with callTool",
        "Send results back to Anthropic",
      ],
    },
    // Errors
    errors: {
      notFound: "Not Found",
      serverError: "Server Error",
      networkError: "Network Error",
      unauthorized: "Unauthorized",
      forbidden: "Forbidden",
      badRequest: "Bad Request",
      unknown: "Unknown Error",
    },
  },
  tr: {
    // Common
    common: {
      loading: "Yükleniyor...",
      error: "Hata",
      success: "Başarılı",
      save: "Kaydet",
      cancel: "İptal",
      delete: "Sil",
      edit: "Düzenle",
      create: "Oluştur",
      back: "Geri",
      next: "İleri",
      previous: "Geri",
      copy: "Kopyala",
      copied: "Kopyalandı!",
      download: "İndir",
      close: "Kapat",
      confirm: "Onayla",
      search: "Ara",
      filter: "Filtrele",
      actions: "İşlemler",
      logout: "Çıkış",
    },
    // Navigation
    nav: {
      home: "Ana Sayfa",
      integrations: "Entegrasyonlar",
      newIntegration: "Yeni Entegrasyon",
      settings: "Ayarlar",
    },
    // Home
    home: {
      title: "API to MCP Gateway",
      subtitle:
        "Kurum içi API'lerinizi MCP tool'larına dönüştürün ve Claude Desktop ile entegre edin",
      manageIntegrations: "Entegrasyonları Yönet",
      features: {
        fastIntegration: {
          title: "Hızlı Entegrasyon",
          description:
            "OpenAPI/Swagger spec dosyalarınızı yükleyin ve otomatik olarak MCP tool'larına dönüştürün.",
        },
        secureManagement: {
          title: "Güvenli Yönetim",
          description:
            "API kimlik bilgileriniz şifrelenmiş olarak saklanır ve güvenli bir şekilde yönetilir.",
        },
        flexibleConfiguration: {
          title: "Esnek Yapılandırma",
          description:
            "Production ve test ortamlarını ayrı ayrı yönetin ve istediğiniz endpoint'leri seçin.",
        },
        easyManagement: {
          title: "Kolay Yönetim",
          description:
            "Kullanıcı dostu arayüz ile entegrasyonlarınızı kolayca yönetin ve yapılandırın.",
        },
      },
    },
    // Integrations
    integrations: {
      title: "API Entegrasyonları",
      subtitle: "Kurum içi API'lerinizi yönetin ve MCP tool'larına dönüştürün",
      newIntegration: "Yeni Entegrasyon",
      createNew: "Yeni Entegrasyon Oluştur",
      noIntegrations: "Henüz entegrasyon yok",
      noIntegrationsDescription: "İlk entegrasyonunuzu oluşturarak başlayın",
      createFirst: "Yeni Entegrasyon Oluştur",
      production: "Production",
      test: "Test",
      activeEnv: "Aktif Ortam",
      deleteConfirm: '"{name}" entegrasyonunu silmek istediğinize emin misiniz?',
      loading: "Entegrasyonlar yükleniyor...",
      name: "Ad",
      baseUrl: "Base URL",
      createdAt: "Oluşturulma",
    },
    // Integration Form
    integrationForm: {
      title: "Yeni API Entegrasyonu",
      editTitle: "API Entegrasyonunu Düzenle",
      subtitle: "Yeni bir API entegrasyonu oluşturun ve MCP tool'larına dönüştürün",
      editSubtitle: "Entegrasyon bilgilerini güncelleyin",
      name: "Entegrasyon Adı",
      namePlaceholder: "örn. Kullanıcı Yönetimi API",
      description: "Açıklama",
      descriptionPlaceholder: "API hakkında kısa açıklama",
      baseUrlProd: "Production Base URL",
      baseUrlProdPlaceholder: "https://api.example.com",
      baseUrlTest: "Test Base URL",
      baseUrlTestPlaceholder: "https://test-api.example.com",
      activeEnv: "Aktif Ortam",
      activeEnvProd: "Production",
      activeEnvTest: "Test",
      save: "Entegrasyonu Kaydet",
      cancel: "İptal",
      creating: "Oluşturuluyor...",
      saving: "Kaydediliyor...",
      step1: "Adım 1: Temel Bilgiler",
      step1Description: "Entegrasyon için temel bilgileri girin",
      step2: "Adım 2: OpenAPI/Swagger Spec Yükle",
      step2Description: "OpenAPI veya Swagger specification dosyanızı yükleyin",
      uploadFile: "Dosya Yükle",
      or: "veya",
      provideUrl: "URL Ver",
      fetchFromUrl: "URL'den Çek",
      specUrl: "Spec URL",
      specUrlPlaceholder: "https://api.example.com/swagger.json",
      fetch: "Getir",
      uploading: "Yükleniyor...",
      fetching: "Getiriliyor...",
      uploadAndExtract: "Spec'i Yükle ve Endpoint'leri Çıkar",
      success: "Spec başarıyla yüklendi",
      error: "Spec yüklenemedi",
      notFound: "Entegrasyon bulunamadı",
    },
    // Endpoints
    endpoints: {
      title: "Endpoint'leri Yönet",
      subtitle: "MCP tool olarak kullanmak istediğiniz endpoint'leri seçin",
      noEndpoints: "Endpoint bulunamadı",
      noEndpointsDescription: "Endpoint'leri çıkarmak için OpenAPI/Swagger spec yükleyin",
      noEndpointsMessage: "Henüz endpoint bulunmuyor. Önce API spec dosyasını yükleyin.",
      selectAll: "Tümünü Seç",
      deselectAll: "Seçimi Kaldır",
      save: "Seçimi Kaydet",
      saveSuccess: "Tool seçimleri kaydedildi!",
      toolName: "Tool Adı",
      toolDescription: "Tool Açıklaması",
      toolNamePlaceholder: "Tool Adı",
      toolDescriptionPlaceholder: "Tool Açıklaması",
      method: "Method",
      path: "Path",
      summary: "Özet",
      enabled: "Aktif",
      manageEndpoints: "Endpoint'leri Yönet",
      addEndpoint: "Endpoint Ekle",
      editEndpoint: "Endpoint Düzenle",
      deleteEndpoint: "Endpoint Sil",
      deleteConfirm: "Bu endpoint'i silmek istediğinize emin misiniz?",
      methodPlaceholder: "GET, POST, PUT, PATCH, DELETE",
      pathPlaceholder: "/api/users",
      summaryPlaceholder: "Kısa açıklama",
      descriptionPlaceholder: "Detaylı açıklama",
      requestSchema: "Request Schema (JSON)",
      responseSchema: "Response Schema (JSON)",
      requestSchemaPlaceholder: '{"type": "object", "properties": {...}}',
      responseSchemaPlaceholder: '{"type": "object", "properties": {...}}',
      create: "Oluştur",
      update: "Güncelle",
      cancel: "İptal",
      created: "Endpoint başarıyla oluşturuldu",
      updated: "Endpoint başarıyla güncellendi",
      deleted: "Endpoint başarıyla silindi",
      error: "Endpoint yönetimi başarısız",
      selectedEndpoints: "Seçili Endpoint'ler (MCP Tool'lar)",
      selectedEndpointsDescription:
        "Bu endpoint'ler MCP tool olarak etkinleştirilmiş ve Claude Desktop'ta kullanılabilir",
      availableEndpoints: "Mevcut Endpoint'ler",
      availableEndpointsDescription: "MCP tool olarak etkinleştirmek için endpoint'leri seçin",
      searchPlaceholder: "Method, path, özet ile endpoint ara...",
      searchResults: "{total} endpoint'ten {count} tanesi bulundu",
      noSearchResults: "Aramanıza uygun endpoint bulunamadı",
      useExternalUrl: "Farklı bir uygulamaya ait tam URL kullan (baseUrl yerine)",
      useExternalUrlHint:
        "Path yerine tam URL kullanılacak. Ortam değişkenine (prod/test) göre uygun URL çağrılır.",
      externalUrlProd: "External URL (Production)",
      externalUrlTest: "External URL (Test)",
    },
    // MCP Config
    mcpConfig: {
      title: "Entegrasyon Yapılandırması",
      subtitle: "Platformunuz için yapılandırmayı kopyalayın veya indirin",
      platformSelection: "Platform Seçimi",
      targetPlatform: "Hedef Platform",
      os: "İşletim Sistemi",
      language: "Programlama Dili",
      installationSteps: "Kurulum Adımları",
      configJson: "Yapılandırma (JSON)",
      configFileLocation: "Config Dosyası Konumu",
      forPlatform: "{platform} için",
      otherPlatforms: "Diğer platformlar",
      windows: "Windows",
      macos: "macOS",
      linux: "Linux",
      claudeDesktop: "Claude Desktop",
      n8n: "n8n",
      openai: "OpenAI",
      anthropic: "Anthropic",
      python: "Python",
      javascript: "JavaScript",
      endpoints: "Endpoint'ler",
      authentication: "Kimlik Doğrulama",
      exampleRequests: "Örnek İstekler",
      integrationExamples: "Entegrasyon Örnekleri",
      getTools: "Tool'ları Al",
      callTool: "Tool Çağrısı",
      copyCode: "Kodu Kopyala",
      httpEndpoint: "HTTP Endpoint",
      integrationIdHeader: "İsteklerde X-Integration-Id header'ı zorunludur.",
      configNotFound: "Config bulunamadı",
      errorTitle: "Hata",
      errorSubtitle: "Yapılandırma yüklenirken bir hata oluştu",
      installationStepsClaude: [
        "Claude Desktop uygulamasını açın",
        "Settings (Ayarlar) menüsüne gidin",
        "Developer Settings bölümünü bulun",
        "Aşağıdaki JSON yapılandırmasını kopyalayın",
        "Claude Desktop config dosyasına ekleyin",
        "Claude Desktop'u yeniden başlatın",
      ],
      installationStepsN8n: [
        "n8n'i açın ve yeni bir workflow oluşturun",
        "HTTP Request node'u ekleyin",
        "Aşağıdaki endpoint'i kullanarak tool'ları çağırın",
        "API Key'i header olarak ekleyin (X-API-Key)",
        "Workflow'u test edin ve kaydedin",
      ],
      installationStepsOpenAI: [
        "HTTP endpoint üzerinden listTools ile tool listesini alın",
        "Tool'ları OpenAI function formatına dönüştürün",
        "OpenAI API'ye tool'ları gönderin",
        "Tool çağrılarını callTool ile gateway'e proxy edin",
        "Sonuçları OpenAI'ye geri gönderin",
      ],
      installationStepsAnthropic: [
        "HTTP endpoint üzerinden listTools ile tool listesini alın",
        "Tool'ları Anthropic tool formatına dönüştürün",
        "Anthropic API'ye tool'ları gönderin",
        "Tool çağrılarını callTool ile gateway'e proxy edin",
        "Sonuçları Anthropic'e geri gönderin",
      ],
    },
    // Errors
    errors: {
      notFound: "Bulunamadı",
      serverError: "Sunucu Hatası",
      networkError: "Ağ Hatası",
      unauthorized: "Yetkisiz",
      forbidden: "Yasak",
      badRequest: "Geçersiz İstek",
      unknown: "Bilinmeyen Hata",
    },
  },
} as const;

export function getTranslations(locale: Locale) {
  return translations[locale] || translations[defaultLocale];
}

export function t(
  locale: Locale,
  key: string,
  params?: Record<string, string>,
): string {
  const keys = key.split(".");
  let value: unknown = translations[locale] || translations[defaultLocale];

  for (const k of keys) {
    value = (value as Record<string, unknown> | undefined)?.[k];
    if (value === undefined) {
      // Varsayılan dile düş
      value = translations[defaultLocale];
      for (const k2 of keys) {
        value = (value as Record<string, unknown> | undefined)?.[k2];
      }
      break;
    }
  }

  if (typeof value !== "string") {
    return key;
  }

  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, p) => params[p] ?? match);
  }

  return value;
}
