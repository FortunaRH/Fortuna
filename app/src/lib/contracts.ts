// Shared constants mirroring the on-chain values in the contracts.
import { parseAbi } from "viem";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// ---- Fortuna (randomness layer) ----
export const ENTROPY_ADDRESS = (process.env.NEXT_PUBLIC_ENTROPY_ADDRESS ??
  ZERO_ADDRESS) as `0x${string}`;
export const COINFLIP_ADDRESS = (process.env.NEXT_PUBLIC_COINFLIP_ADDRESS ??
  ZERO_ADDRESS) as `0x${string}`;
export const PROVIDER_ADDRESS = (process.env.NEXT_PUBLIC_PROVIDER_ADDRESS ??
  ZERO_ADDRESS) as `0x${string}`;

// ---- NFT / staking ----
export const NFT_ADDRESS = (process.env.NEXT_PUBLIC_NFT_ADDRESS ??
  ZERO_ADDRESS) as `0x${string}`;
export const POOL_ADDRESS = (process.env.NEXT_PUBLIC_POOL_ADDRESS ??
  ZERO_ADDRESS) as `0x${string}`;

export const IS_CONFIGURED =
  NFT_ADDRESS !== ZERO_ADDRESS && POOL_ADDRESS !== ZERO_ADDRESS;

// Art layout (matches GlyphArt.sol / CharacterNFT.sol)
export const ART_WIDTH = 55; // braille cells wide
export const ART_HEIGHT = 35; // braille cells tall
export const COLOR_COUNT = 16;

export const PALETTE = [
  "#ffffff", // white
  "#ff4d4d", // red
  "#ff9f1a", // orange
  "#ffe14d", // yellow
  "#4dff4d", // green
  "#4dffff", // cyan
  "#4d6bff", // blue
  "#b34dff", // purple
  "#ff4dff", // magenta
  "#ff8c8c", // salmon
  "#b4ff4d", // lime
  "#4dffb3", // mint
  "#4db3ff", // sky
  "#b3b3ff", // lavender
  "#ffb3f0", // pink
  "#e6e6e6", // silver
] as const;

export const COLOR_NAMES = [
  "white",
  "red",
  "orange",
  "yellow",
  "green",
  "cyan",
  "blue",
  "purple",
  "magenta",
  "salmon",
  "lime",
  "mint",
  "sky",
  "lavender",
  "pink",
  "silver",
] as const;

export const ENTROPY_ABI = parseAbi([
  "function requestV2(address provider, bytes32 userRandomNumber, uint32 gasLimit) external payable returns (uint64 sequenceNumber)",
  "function getFee(address provider) view returns (uint128)",
  "function getProviderInfo(address provider) view returns (bytes32 commitment, uint128 feeInWei, uint32 defaultGasLimit)",
  "function requestCount() view returns (uint64)",
  "function refundRequest(address provider, uint64 sequenceNumber) external",
  "event Requested(uint64 indexed sequenceNumber, address indexed provider, address indexed requester, bytes32 userRandomNumber)",
  "event Revealed(uint64 indexed sequenceNumber, address indexed provider, bytes32 randomNumber)",
]);

export const COINFLIP_ABI = parseAbi([
  "function flip() payable returns (uint64 sequenceNumber)",
  "function players(uint64 sequenceNumber) view returns (address)",
  "function resolved(uint64 sequenceNumber) view returns (bool)",
  "function heads(uint64 sequenceNumber) view returns (bool)",
  "function provider() view returns (address)",
  "function entropy() view returns (address)",
  "event FlipRequested(uint64 indexed sequenceNumber, address indexed player)",
  "event Flipped(uint64 indexed sequenceNumber, address indexed player, bool heads)",
]);

export const NFT_ABI = parseAbi([
  "function mint() external",
  "function ownerMint(address to, uint256 amount) external",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function setApprovalForAll(address operator, bool approved) external",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function artData(uint256 tokenId) view returns (bytes data, uint8 width, uint8 height, uint8 colorIdx)",
  "event Minted(address indexed to, uint256 indexed tokenId)",
]);

export const POOL_ABI = parseAbi([
  "function stake(uint256 tokenId) external",
  "function unstake(uint256 tokenId) external",
  "function claim(uint256 tokenId) external",
  "function pendingPoints(uint256 tokenId) view returns (uint256)",
  "function pointsOf(address user) view returns (uint256)",
  "function stakedTokensOf(address user) view returns (uint256[])",
  "function stakerOf(uint256 tokenId) view returns (address)",
  "function pointsPerSecond() view returns (uint256)",
  "function totalStaked() view returns (uint256)",
  "event Staked(address indexed user, uint256 indexed tokenId, uint256 at)",
  "event Unstaked(address indexed user, uint256 indexed tokenId, uint256 points)",
]);
