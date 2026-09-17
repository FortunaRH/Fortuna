# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| `main`  | ✅        |

## Reporting a vulnerability

Please report vulnerabilities **privately** — do not open a public issue.

Use GitHub's private security advisory flow:

1. Go to **Security → Advisories → Report a vulnerability** on this repository.
2. Describe the issue, the affected contract/component, and (if possible) a proof of concept or reproduction.

We acknowledge reports within 48 hours and prioritise critical issues.

## Design notes

Fortuna's randomness is non-manipulable by construction (see *How randomness works* in the README):

- The provider commits to a hash chain **before** seeing the caller's input.
- Every reveal is verified on-chain — `keccak256(preimage) == commitment`.
- The final output mixes both contributions, so neither party can bias the result.
- Requests not revealed in time can be refunded by the caller (`refundRequest`).
