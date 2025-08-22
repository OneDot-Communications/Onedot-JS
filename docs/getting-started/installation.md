# Installation

## Prerequisites

- Node.js 16+ 
- PNPM 7+

## Create a new OneDotJS project

```bash
npx create-onedot-app my-app
cd my-app
pnpm install
pnpm dev
```

## Manual setup

1. Create a new project:
```bash
mkdir my-app
cd my-app
pnpm init
```

2. Install OneDotJS:
```bash
pnpm add @onedotjs/core @onedotjs/renderer
```

3. Create tsconfig.json:
```json
{
  "extends": "@onedotjs/core/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```
