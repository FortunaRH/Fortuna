// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IEntropy} from "./interfaces/IEntropy.sol";
import {IEntropyConsumer} from "./interfaces/IEntropyConsumer.sol";

/// @title CoinFlip
/// @notice Demo consumer: flips a fair coin using Fortuna randomness.
contract CoinFlip is IEntropyConsumer {
    IEntropy public immutable entropy;
    address public immutable provider;

    mapping(uint64 => address) public players;
    mapping(uint64 => bool) public resolved;
    mapping(uint64 => bool) public heads;

    event FlipRequested(uint64 indexed sequenceNumber, address indexed player);
    event Flipped(uint64 indexed sequenceNumber, address indexed player, bool heads);

    constructor(address entropy_, address provider_) {
        entropy = IEntropy(entropy_);
        provider = provider_;
    }

    /// @notice Flip the coin. Pays the exact entropy fee (msg.value must match).
    function flip() external payable returns (uint64 sequenceNumber) {
        bytes32 userRandom = keccak256(abi.encodePacked(msg.sender, block.timestamp, block.prevrandao, gasleft()));
        uint64 seq = entropy.requestV2{value: msg.value}(provider, userRandom, 100_000);
        players[seq] = msg.sender;
        emit FlipRequested(seq, msg.sender);
        return seq;
    }

    function entropyCallback(uint64 sequenceNumber, address, bytes32 randomNumber) external {
        require(msg.sender == address(entropy), "only entropy");
        require(!resolved[sequenceNumber], "already resolved");
        resolved[sequenceNumber] = true;
        bool isHeads = uint256(randomNumber) % 2 == 0;
        heads[sequenceNumber] = isHeads;
        emit Flipped(sequenceNumber, players[sequenceNumber], isHeads);
    }

    function getEntropy() external view returns (address) {
        return address(entropy);
    }
}
