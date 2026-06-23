// Standard label generator that links each property-based test to the relevant
// correctness property in the design.
//
// Format: "Feature: mcp-gateway-nextjs-consolidation, Property {number}: {property_text}"

const FEATURE = "mcp-gateway-nextjs-consolidation";

export function propertyLabel(num: number, text: string): string {
  return `Feature: ${FEATURE}, Property ${num}: ${text}`;
}
