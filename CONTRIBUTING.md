# Contributing to ONEDOT-JS

## Prerequisites
- Node.js >= 18.18
- Rust toolchain (stable)
- Git

## Install
```
npm install
npm run build:ts
```

## Dev Workflow
- Core code in `packages/core/src`
- Runtime adaptations in `packages/runtime`
- CLI in `packages/cli`
- Rust bundler in `packages/bundler`

Run dev playground:
```
cd apps/playground
npm run dev
```

## Guidelines
- TypeScript strict rules must pass (no `any` unless justified with comment).
- All new public APIs need tests in `packages/cli/src/tasks/test.ts` (will be refactored to dedicated test runner soon).
- No placeholders or TODO stubs in committed code; implement or omit.
- Follow semantic versioning for published packages.

## Commit Messages
Format: `<type>: <short description>`
Types: feat, fix, perf, refactor, docs, test, build, chore.

## Release
(Automated pipeline to be added) – manual interim: bump versions, update CHANGELOG, tag.

## Security
Report vulnerabilities privately (security contact to be defined before first public release).