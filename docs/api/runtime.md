# Runtime API

## OneDotJSRuntime

The core runtime class that manages the OneDotJS application.

### Methods

#### `getInstance(): OneDotJSRuntime`

Gets the singleton instance of the runtime.

#### `enforceStrictMode(): void`

Enforces strict TypeScript mode. Throws an error if strict mode is not enabled.

### Example

```typescript
import { Runtime } from '@onedotjs/core';

const runtime = Runtime;
runtime.enforceStrictMode();
```
