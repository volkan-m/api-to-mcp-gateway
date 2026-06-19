// Her property-based testi tasarımdaki ilgili doğruluk özelliğine bağlayan
// standart etiket üreticisi.
//
// Biçim: "Feature: mcp-gateway-nextjs-consolidation, Property {number}: {property_text}"

const FEATURE = "mcp-gateway-nextjs-consolidation";

export function propertyLabel(num: number, text: string): string {
  return `Feature: ${FEATURE}, Property ${num}: ${text}`;
}
