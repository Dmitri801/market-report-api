# market-report-api

Small Fastify API for storing and serving market reports.

## Deployment notes

- Railway deployment is expected to bind on `0.0.0.0` and use `process.env.PORT`.
- API auth supports either `x-api-key` header or `apiKey` query parameter.
