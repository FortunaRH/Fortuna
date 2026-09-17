// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IEntropyConsumer
/// @notice Interface a contract implements to receive Fortuna randomness.
interface IEntropyConsumer {
    /// @notice Called by FortunaEntropy with the final verifiable random number.
    function entropyCallback(uint64 sequenceNumber, address provider, bytes32 randomNumber) external;

    /// @notice The Fortuna oracle this consumer trusts (used to verify the callback caller).
    function getEntropy() external view returns (address);
}
