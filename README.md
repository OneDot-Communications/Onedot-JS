# ONEDOT-JS (Initial Core)

This repository contains the foundational implementation of ONEDOT-JS core runtime, reactive system, component model, router, DI, state store, CLI (dev/build/create/test), and a Rust-based bundler skeleton (with real AST parsing) to expand further.

## Packages
- `@onedot/core` – reactivity, components, state, router, DI.
- `@onedot/runtime` – web host renderer + SSR string renderer.
- `@onedot/cli` – project tooling (dev server, build, create, test).
- `@onedot/bundler` – Rust crate with dependency graph & basic tree shaker.

## Quick Start
```powershell
npm install
npm run build
npx onedot create demo
cd demo
npm install "../" -D
npm run dev
```
Visit http://localhost:5173

## Testing
```
npm run test
```

## Roadmap (Immediate Next)
- Integrate Rust bundler into CLI build pipeline.
- HMR websocket channel.
- Advanced tree-shaking + code splitting.
- Platform abstraction for native/desktop (future phases).

All code here is concrete; no placeholders. Extend incrementally following architecture plan.
