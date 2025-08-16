---
"@stork-tools/zod-async-storage": minor
"@stork-tools/zod-local-storage": minor
---

Add flexible error handling and expand Zod compatibility

- Configure global error callbacks to handle all validation failures
- Set per-operation error callbacks for granular error handling  
- Support for Zod v3 alongside existing v4 support for easier migration

This gives you more control over how validation errors are handled in your storage operations.