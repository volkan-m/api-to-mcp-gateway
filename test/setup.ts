import fc from "fast-check";

// Tüm property-based testler için global varsayılan: en az 100 iterasyon.
// (Bireysel testler gerekirse numRuns'ı artırabilir.)
fc.configureGlobal({ numRuns: 100 });

// Testlerde deterministik anahtar türetimi için sabit ENCRYPTION_KEY.
// (crypto.ts env yoksa DEFAULT_KEY kullanır; testte açıkça sabitliyoruz.)
process.env.ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "default_encryption_key_32_chars_!!";
