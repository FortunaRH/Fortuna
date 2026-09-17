// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IEntropy
/// @notice Interface for Fortuna's commit-reveal verifiable randomness oracle.
interface IEntropy {
    /// @notice Request verifiable randomness.
    /// @param provider The registered provider whose hash chain will be revealed.
    /// @param userRandomNumber Client-generated randomness (kept private off-chain).
    /// @param gasLimit Gas limit for the entropyCallback call (0 = provider default).
    /// @return sequenceNumber The id of the created request.
    function requestV2(address provider, bytes32 userRandomNumber, uint32 gasLimit)
        external
        payable
        returns (uint64 sequenceNumber);

    /// @notice Reveal the provider's preimage for a request (permissionless).
    function reveal(address provider, uint64 sequenceNumber, bytes32 userRandomNumber, bytes32 providerRandomNumber)
        external;

    /// @notice Reveal and route the callback to `target` (defaults to the requester if zero).
    function revealWithCallback(
        address provider,
        uint64 sequenceNumber,
        bytes32 userRandomNumber,
        bytes32 providerRandomNumber,
        address target
    ) external;

    /// @notice Refund an unfulfilled request after the refund delay.
    function refundRequest(address provider, uint64 sequenceNumber) external;

    function getFee(address provider) external view returns (uint128);
}
