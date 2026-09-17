// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IEntropyConsumer} from "./interfaces/IEntropyConsumer.sol";

/// @title FortunaEntropy
/// @notice Commit-reveal verifiable randomness oracle for Robinhood.
///         A provider pre-commits to a hash chain (S/KEY-style); each request is
///         fulfilled by revealing the next preimage, verified on-chain via Keccak256,
///         and combined with user-contributed randomness so neither party can bias it.
contract FortunaEntropy is Ownable, ReentrancyGuard {
    error NoSuchProvider();
    error NoSuchRequest();
    error IncorrectRevelation();
    error InsufficientFee();
    error MaxGasLimitExceeded();
    error RequestAlreadyFulfilled();
    error Unauthorized();
    error RefundTooEarly();

    uint256 public constant MAX_GAS_LIMIT = 2_000_000;
    uint256 public constant DEFAULT_GAS_LIMIT = 200_000;
    uint256 public refundDelayBlocks = 6;

    struct ProviderInfo {
        uint128 feeInWei;
        uint32 defaultGasLimit;
        bytes32 commitment; // current head of the hash chain
        bool registered;
    }

    struct Request {
        address provider;
        address requester;
        bytes32 userRandomNumber;
        uint32 gasLimit;
        uint128 feePaid;
        uint256 blockNumber;
        bool fulfilled;
        bool refunded;
    }

    mapping(address => ProviderInfo) public providers;
    mapping(uint64 => Request) public requests;
    uint64 public requestCount;

    event ProviderRegistered(address indexed provider, bytes32 commitment, uint128 feeInWei);
    event Requested(
        uint64 indexed sequenceNumber,
        address indexed provider,
        address indexed requester,
        bytes32 userRandomNumber
    );
    event Revealed(uint64 indexed sequenceNumber, address indexed provider, bytes32 randomNumber);
    event Refunded(
        uint64 indexed sequenceNumber,
        address indexed provider,
        address indexed requester,
        uint128 amount
    );
    event FeesWithdrawn(address indexed to, uint256 amount);

    constructor() Ownable(msg.sender) {}

    // ---- admin / provider management ----

    function registerProvider(address provider, bytes32 commitment, uint128 feeInWei) external onlyOwner {
        ProviderInfo storage p = providers[provider];
        p.registered = true;
        p.commitment = commitment;
        p.feeInWei = feeInWei;
        p.defaultGasLimit = uint32(DEFAULT_GAS_LIMIT);
        emit ProviderRegistered(provider, commitment, feeInWei);
    }

    function setProviderFee(address provider, uint128 feeInWei) external onlyOwner {
        providers[provider].feeInWei = feeInWei;
    }

    function setDefaultGasLimit(address provider, uint32 gasLimit) external onlyOwner {
        providers[provider].defaultGasLimit = gasLimit;
    }

    function setRefundDelayBlocks(uint256 blocks_) external onlyOwner {
        refundDelayBlocks = blocks_;
    }

    function withdrawFees(address to) external onlyOwner {
        uint256 amount = address(this).balance;
        emit FeesWithdrawn(to, amount);
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "withdraw failed");
    }

    // ---- public getters ----

    function getFee(address provider) external view returns (uint128) {
        return providers[provider].feeInWei;
    }

    function getProviderInfo(address provider)
        external
        view
        returns (bytes32 commitment, uint128 feeInWei, uint32 defaultGasLimit)
    {
        ProviderInfo storage p = providers[provider];
        return (p.commitment, p.feeInWei, p.defaultGasLimit);
    }

    function getRequest(uint64 sequenceNumber) external view returns (Request memory) {
        return requests[sequenceNumber];
    }

    // ---- request / reveal / refund ----

    function requestV2(address provider, bytes32 userRandomNumber, uint32 gasLimit)
        external
        payable
        returns (uint64 sequenceNumber)
    {
        ProviderInfo storage p = providers[provider];
        if (!p.registered) revert NoSuchProvider();
        if (msg.value != p.feeInWei) revert InsufficientFee();
        if (gasLimit > MAX_GAS_LIMIT) revert MaxGasLimitExceeded();

        uint64 seq = requestCount++;
        requests[seq] = Request({
            provider: provider,
            requester: msg.sender,
            userRandomNumber: userRandomNumber,
            gasLimit: gasLimit,
            feePaid: uint128(msg.value),
            blockNumber: block.number,
            fulfilled: false,
            refunded: false
        });
        emit Requested(seq, provider, msg.sender, userRandomNumber);
        return seq;
    }

    function reveal(address provider, uint64 sequenceNumber, bytes32 userRandomNumber, bytes32 providerRandomNumber)
        external
        nonReentrant
    {
        _reveal(provider, sequenceNumber, userRandomNumber, providerRandomNumber, address(0));
    }

    function revealWithCallback(
        address provider,
        uint64 sequenceNumber,
        bytes32 userRandomNumber,
        bytes32 providerRandomNumber,
        address target
    ) external nonReentrant {
        _reveal(provider, sequenceNumber, userRandomNumber, providerRandomNumber, target);
    }

    function refundRequest(address provider, uint64 sequenceNumber) external nonReentrant {
        Request storage r = requests[sequenceNumber];
        if (r.provider != provider) revert NoSuchRequest();
        if (r.requester == address(0)) revert NoSuchRequest();
        if (r.requester != msg.sender) revert Unauthorized();
        if (r.fulfilled || r.refunded) revert RequestAlreadyFulfilled();
        if (block.number < r.blockNumber + refundDelayBlocks) revert RefundTooEarly();

        r.refunded = true;
        uint128 amount = r.feePaid;
        emit Refunded(sequenceNumber, provider, r.requester, amount);
        (bool ok, ) = r.requester.call{value: amount}("");
        require(ok, "refund failed");
    }

    // ---- internal ----

    function _reveal(
        address provider,
        uint64 sequenceNumber,
        bytes32 userRandomNumber,
        bytes32 providerRandomNumber,
        address target
    ) internal {
        ProviderInfo storage p = providers[provider];
        if (!p.registered) revert NoSuchProvider();

        Request storage r = requests[sequenceNumber];
        if (r.requester == address(0)) revert NoSuchRequest();
        if (r.provider != provider) revert NoSuchRequest();
        if (r.fulfilled || r.refunded) revert RequestAlreadyFulfilled();
        if (r.userRandomNumber != userRandomNumber) revert IncorrectRevelation();
        if (keccak256(abi.encodePacked(providerRandomNumber)) != p.commitment) revert IncorrectRevelation();

        r.fulfilled = true;
        p.commitment = providerRandomNumber; // advance the chain

        bytes32 randomNumber = keccak256(abi.encodePacked(userRandomNumber, providerRandomNumber));
        emit Revealed(sequenceNumber, provider, randomNumber);

        address callbackTarget = target == address(0) ? r.requester : target;
        uint32 gasLimit = r.gasLimit == 0 ? p.defaultGasLimit : r.gasLimit;
        if (callbackTarget.code.length > 0) {
            // Best-effort callback; never revert the reveal if the consumer fails.
            try IEntropyConsumer(callbackTarget).entropyCallback{gas: gasLimit}(
                sequenceNumber,
                provider,
                randomNumber
            ) {} catch {}
        }
    }
}
