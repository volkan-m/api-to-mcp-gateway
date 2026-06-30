# Xquik OpenAPI Gateway Example

Xquik publishes an OpenAPI document that API to MCP Gateway can import by URL
and expose as MCP tools.

## Add the Integration

Use these values in the dashboard when creating an integration:

| Field | Value |
| --- | --- |
| Name | Xquik |
| OpenAPI URL | `https://xquik.com/openapi.json` |
| Base URL | `https://xquik.com` |

## Add Credentials

Create a header credential for your Xquik API key:

| Field | Value |
| --- | --- |
| Type | Header |
| Header name | `x-api-key` |
| Header value | `<your-xquik-api-key>` |

Keep the credential value private. Do not commit it to the repository or paste
it into shared issue reports.

## Verify the Tools

After the schema is imported, list the generated MCP tools for the integration
and start with a read-only endpoint such as tweet search. Use write endpoints
only after the credential, account, and request payload are configured for the
target Xquik account.
