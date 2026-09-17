# Fortuna

Fortuna is the **verifiable randomness layer for Robinhood** — powering games, AI agents, DeFi, and autonomous onchain applications with randomness that nobody can rig.

Fortuna ships as two layers:

1. **Randomness** — a commit-reveal oracle that produces provably fair, verifiable numbers.
2. **An onchain economy** — the `$FORT` (Fortune) token and the **Glyph** NFT collection, where holders activate and stake their NFTs to earn from the network's activity.

> Privacy note: this repo contains **no** personal identifiers, wallet addresses, API keys, or secrets. All secrets are read from environment variables (see `.env.example`) and never committed.

## The $FORT token & Glyph NFTs

Fortuna isn't only an oracle — it's a self-reinforcing economy. The `$FORT`
(Fortune) token and the **Glyph** NFT collection tie usage of the randomness
layer to a scarce, productive asset.

### $FORT — the Fortune token

> `$FORT` is launched on [ntrpy.fun](https://app.ntrpy.fun/).

`$FORT` is Fortuna's native ERC-20 token with three jobs:

- **Activation** — `$FORT` is spent to activate a Glyph, raising its reward
  rate. While activated, that `$FORT` is locked out of circulation.
- **Rewards** — `$FORT` is what activated Glyphs earn back while staked.
- **Redemption** — an activated Glyph can be redeemed at any time, refunding the
  full `$FORT` activation cost.

That makes `$FORT` a working asset rather than a passive governance token: it is
continuously spent to unlock earning power, continuously paid back out to the
holders who unlock it, and fully recoverable when a holder redeems.

### Glyph — a fixed, fully on-chain NFT

**Glyph** is Fortuna's NFT collection. Every Glyph is drawn entirely on-chain
from its token id — the art lives in the contract (`GlyphArt` / `CharacterNFT`),
so it renders identically everywhere with no off-chain metadata server.

The collection is hard-capped:

| Property | Value |
|---|---|
| Max supply | `1,024` (`MAX_SUPPLY`) |
| Mint limit | `10` per wallet (`MAX_PER_WALLET`) |
| Art | Deterministic Braille portrait, tinted per token |
| Color palettes | 16, selected on-chain |

Because supply is fixed at 1,024 and minting is capped per wallet, the
collection cannot be inflated and no single wallet can corner it. Every Glyph is
one of a finite set — there is no mint path that adds more.

### Activate, then stake

A Glyph earns along two rails:

1. **Points (always on).** Staking a Glyph farms points every second. Points
   accrue from the moment a Glyph is staked.
2. **$FORT (activated).** Activating a Glyph with `$FORT` raises its reward
   rate. An activated Glyph additionally accrues `$FORT` while staked.

Activation follows the owner, not the token id. If a Glyph is transferred, its
activation does not carry over to the new holder, so earning power must be
re-earned. This keeps activation honest and prevents reward farming by
wallet-hopping.

Activation is also reversible: a holder can redeem an activated Glyph at any
time and receive the full `$FORT` activation cost back.

### Why this compounds

The economy is built so usage and holders pull in the same direction:

- **Rewards come from usage, not issuance.** Every randomness request is paid
  for by its caller, and every trade pays a fee. A share of those fees is routed
  to activated stakers. Holders earn what others pay to use the network — there
  is no new-token minting inflating the rewards.
- **Activation locks supply.** Each activation locks `$FORT` out of circulation
  while increasing the activator's reward rate. It returns in full on redeem,
  so earning power grows while the outstanding float is temporarily tightened.
- **Scarcity is structural.** The 1,024 Glyph cap and the per-wallet limit are
  enforced in the contract, not by policy.
- **Every role is compensated.** Providers commit randomness, consumers pay for
  it, and activated holders capture the value — a cycle in which activity
  creates demand for the fixed NFT supply.

In short: the randomness layer produces fees, and the Glyph + `$FORT` layer
decides who shares in them. Holding is how you join; activation and staking are
how you earn.

## How it works

Fortuna combines two sources of randomness so neither party can bias the result:

1. **Request** — a consumer calls `requestV2(provider, userRandom, gasLimit)`, paying an exact fee.
2. **Reveal** — a keeper submits the next preimage of a pre-committed hash chain; it is verified on-chain via `Keccak256`.
3. **Callback** — the oracle combines both values and calls `entropyCallback(seq, provider, random)`.

```
User contract                FortunaEntropy                Keeper
     │                            │                          │
     │── requestV2() ────────────►│                          │
     │   (pays exact fee)         │                          │
     │                            │── Requested event ──────►│
     │                            │◄── revealWithCallback() ─│
     │◄── entropyCallback() ──────│   (verifies hash chain)  │
```

## Architecture

```
contracts/        Foundry + Solidity
  src/FortunaEntropy.sol   commit-reveal oracle (hash chain, fees, refunds)
  src/interfaces/          IEntropy, IEntropyConsumer
  src/CoinFlip.sol         demo consumer
  src/CharacterNFT.sol     Glyph NFT collection (fixed 1,024 supply, on-chain art)
  src/GlyphArt.sol         on-chain Braille portrait data
  src/StakingPool.sol      stake Glyphs to farm points
  script/Deploy.s.sol      deploys the protocol, registers provider
  test/                    unit tests

  # planned: FortuneToken.sol ($FORT ERC-20) + NFT activation contract

app/              Next.js (frontend)
  src/lib/        chain config, wagmi config, ABIs/addresses
  src/components/ FortunaDemo, NFT gallery, ASCII art, CRT landing
  src/app/api/    /health
  scripts/keeper.mjs       Node + viem reveal keeper
```

## 1. Deploy to Robinhood mainnet

```bash
cd contracts
forge install foundry-rs/forge-std@v1.9.6 --no-git
forge install OpenZeppelin/openzeppelin-contracts@v5.1.0 --no-git
forge build
forge test

# Generate a hash-chain commitment (see keeper below), then deploy + register:
PROVIDER=0x... PROVIDER_COMMITMENT=0x... forge script script/Deploy.s.sol --rpc-url robinhood --broadcast
```

The script prints the `FortunaEntropy` and `CoinFlip` addresses. Copy them into `.env.local`.

## 2. Run the keeper

```bash
cd app
KEEPER_PRIVATE_KEY=0x... \
ORACLE_ADDRESS=0x... \
PROVIDER_ADDRESS=0x... \
CHAIN_SECRET=0x... \
node scripts/keeper.mjs
```

The keeper prints the `commitment` — register that value on-chain with `registerProvider` (the deploy script can do it via `PROVIDER`/`PROVIDER_COMMITMENT`).

## 3. Run the frontend

```bash
cd app
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_ENTROPY_ADDRESS, etc.
npm run dev
```

Open http://localhost:3000, connect MetaMask, switch to Robinhood mainnet, and flip the coin on `/play`.

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_ENTROPY_ADDRESS` | Deployed FortunaEntropy address (public) |
| `NEXT_PUBLIC_COINFLIP_ADDRESS` | Deployed CoinFlip address (public) |
| `NEXT_PUBLIC_PROVIDER_ADDRESS` | Registered provider/keeper address (public) |
| `NEXT_PUBLIC_NFT_ADDRESS` | Deployed CharacterNFT (Glyph) address (public) |
| `NEXT_PUBLIC_POOL_ADDRESS` | Deployed StakingPool address (public) |
| `NEXT_PUBLIC_RPC_URL` | Robinhood RPC (default `https://rpc.mainnet.chain.robinhood.com`) |
| `PRIVATE_KEY` | (contracts only) deployer key — never commit |

## Robinhood mainnet reference

- Chain ID: `4663`
- RPC: `https://rpc.mainnet.chain.robinhood.com`
- Explorer: https://robinscan.io
- Bridge: https://portal.arbitrum.io/bridge?destinationChain=robinhood-chain&sourceChain=ethereum
- Gas token: **ETH** (native, 18 decimals)

## How randomness works

A provider pre-commits to a hash chain (`commitment = keccak256^n(seed)`). Each request is fulfilled by revealing the next preimage, which the oracle verifies (`keccak256(preimage) == commitment`) before advancing the chain. The final number is `keccak256(userRandom, providerPreimage)`. Because the provider commits before seeing the user's value and must reveal a value that matches its commitment, neither party can bias the result.

If a request is not revealed within the refund delay, the requester can call `refundRequest` to reclaim the exact fee.
# Fortuna_app
# Fortuna_app
# Fortuna_app
# Fortuna_app
