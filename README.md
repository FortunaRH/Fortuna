# Fortuna

> Verifiable randomness for Robinhood — commit-reveal randomness that nobody can rig.

![Solidity](https://img.shields.io/badge/solidity-0.8.24-363636)
![Tests](https://img.shields.io/badge/tests-6%20passing-28a745)
![License](https://img.shields.io/badge/license-MIT-blue)
![Network](https://img.shields.io/badge/network-Robinhood%20mainnet-0cf)

Fortuna is a verifiable randomness oracle for EVM chains. A contract asks Fortuna for a random number and gets back one that anyone can verify — so neither the caller nor the provider can bias the outcome.

---

## Status

| Component | Status |
|---|---|
| `$FORT` token (ERC-20) | 🟢 **Live on Robinhood mainnet** (launched via [ntrpy.fun](https://app.ntrpy.fun/app/token/0xe95f4bbfb38fb1b953ffd0b437defffc201784ca)) |
| `FortunaEntropy` oracle | 🟢 Implemented + tested |
| `CharacterNFT` (Glyph) | 🟢 Implemented |
| `StakingPool` (points) | 🟢 Implemented |
| `CoinFlip` reference consumer | 🟢 Implemented |
| `$FORT` activation / reward rails | 🟡 Roadmap |

## The $FORT token

`$FORT` is Fortuna's ERC-20 token, live on Robinhood mainnet.

| Property | Value |
|---|---|
| Name | Fortuna |
| Symbol | `FORT` |
| Decimals | `18` |
| Total supply | `1,000,000,000` FORT |
| Contract | [`0xe95f4bbfb38fb1b953ffd0b437defffc201784ca`](https://robinscan.io/address/0xe95f4bbfb38fb1b953ffd0b437defffc201784ca) |
| Trade | [ntrpy.fun](https://app.ntrpy.fun/app/token/0xe95f4bbfb38fb1b953ffd0b437defffc201784ca) |

## How randomness works

A provider pre-commits to a hash chain:

```
commitment = keccak256^n(seed)
```

Each request is answered by revealing the next preimage on-chain. The oracle verifies `keccak256(preimage) == commitment` before advancing the chain, and the final number is:

```
result = keccak256(userRandom, providerPreimage)
```

Because the provider commits **before** seeing the caller's value and must reveal a value that matches the commitment, neither party can bias the result. If a request is not revealed within the refund delay, the caller can call `refundRequest` to reclaim the exact fee.

## What's in the repo

| Contract | Purpose |
|---|---|
| `src/FortunaEntropy.sol` | Commit-reveal oracle — hash chain, fees, refunds, callbacks |
| `src/interfaces/IEntropy.sol` | Oracle interface |
| `src/interfaces/IEntropyConsumer.sol` | Consumer callback interface |
| `src/CoinFlip.sol` | Minimal consumer / end-to-end demo |
| `src/CharacterNFT.sol` | Glyph NFT — fixed 1,024 supply, fully on-chain art |
| `src/GlyphArt.sol` | On-chain Braille portrait generator |
| `src/StakingPool.sol` | Stake Glyphs to farm points |
| `script/Deploy.s.sol` | Deploys the protocol and registers the provider |
| `app/` | Next.js frontend (CRT landing, demo, NFT gallery, docs) |
| `app/scripts/keeper.mjs` | Node + viem reveal keeper |

## Architecture

```
   consumer ── requestV2() ─────────►  FortunaEntropy (oracle)
                                            │
                                            │ verifies keccak256(preimage) == commitment
                                            ▼
   provider (keeper) ── revealWithCallback() ──► entropyCallback()
                                            │
                                            ▼
                              result = keccak256(userRandom, preimage)
```

```
contracts/        Foundry + Solidity 0.8.24
  src/            oracle, NFT, staking, demo, interfaces
  script/         deploy script
  test/           unit tests (forge)

app/              Next.js frontend
  src/            chain config, wagmi, ABIs, components
  scripts/        keeper
```

## Testing

```bash
cd contracts
forge test
```

```
Ran 6 tests for test/FortunaEntropy.t.sol:FortunaEntropyTest
[PASS] test_CallbackDeliversRandom
[PASS] test_CoinFlipResolves
[PASS] test_RefundAfterDelay
[PASS] test_RequestAndRevealAdvancesChain
[PASS] test_RevertInsufficientFee
[PASS] test_RevertNoSuchProvider
Suite result: ok. 6 passed; 0 failed; 0 skipped
```

## Quick start

### 1. Deploy the contracts

```bash
cd contracts
forge install foundry-rs/forge-std@v1.9.6 --no-git
forge install OpenZeppelin/openzeppelin-contracts@v5.1.0 --no-git
forge build
forge test

# Generate a hash-chain commitment (see keeper below), then deploy + register:
PROVIDER=0x... PROVIDER_COMMITMENT=0x... forge script script/Deploy.s.sol --rpc-url robinhood --broadcast
```

### 2. Run the keeper

```bash
cd app
KEEPER_PRIVATE_KEY=0x... \
ORACLE_ADDRESS=0x... \
PROVIDER_ADDRESS=0x... \
CHAIN_SECRET=0x... \
node scripts/keeper.mjs
```

### 3. Run the frontend

```bash
cd app
npm install
cp .env.example .env.local
npm run dev
```

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_ENTROPY_ADDRESS` | Deployed `FortunaEntropy` address |
| `NEXT_PUBLIC_COINFLIP_ADDRESS` | Deployed `CoinFlip` address |
| `NEXT_PUBLIC_PROVIDER_ADDRESS` | Registered provider/keeper address |
| `NEXT_PUBLIC_NFT_ADDRESS` | Deployed `CharacterNFT` address |
| `NEXT_PUBLIC_POOL_ADDRESS` | Deployed `StakingPool` address |
| `NEXT_PUBLIC_RPC_URL` | Robinhood RPC (default `https://rpc.mainnet.chain.robinhood.com`) |
| `PRIVATE_KEY` | (contracts only) deployer key — never commit |

## Robinhood mainnet reference

- Chain ID: `4663`
- RPC: `https://rpc.mainnet.chain.robinhood.com`
- Explorer: https://robinscan.io
- Bridge: https://portal.arbitrum.io/bridge?destinationChain=robinhood-chain&sourceChain=ethereum
- Gas token: **ETH** (native, 18 decimals)

## Roadmap

- [x] Commit-reveal randomness oracle (hash chain, fees, refunds, callbacks)
- [x] Glyph NFT — fixed 1,024 supply, fully on-chain art
- [x] Points staking pool
- [x] Coin-flip reference consumer
- [x] Frontend + reveal keeper
- [x] `$FORT` token launch on Robinhood mainnet (via ntrpy.fun)
- [ ] `$FORT` activation → reward rails for staked Glyphs
- [ ] Third-party security audit

## Security

See [SECURITY.md](SECURITY.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)

