# Contributing

Thanks for helping build Fortuna.

## Setup

### Contracts (Foundry, Solidity 0.8.24)

```bash
cd contracts
forge install foundry-rs/forge-std@v1.9.6 --no-git
forge install OpenZeppelin/openzeppelin-contracts@v5.1.0 --no-git
forge build
forge test
```

### Frontend (Next.js)

```bash
cd app
npm install
npm run dev
```

## Before opening a pull request

- Contracts: `cd contracts && forge test` must pass.
- Frontend: `cd app && npx tsc --noEmit` must pass.

## Conventions

- **Solidity** — `pragma solidity ^0.8.24`, MIT SPDX header, `forge fmt` (line length 120).
- **TypeScript** — strict mode; the `@/` path alias maps to `app/src/`.

## Pull requests

Keep changes focused and reference an issue when one exists. CI runs the
contract tests and the frontend typecheck automatically.
