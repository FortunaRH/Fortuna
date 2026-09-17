// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {CharacterNFT} from "../src/CharacterNFT.sol";
import {StakingPool} from "../src/StakingPool.sol";
import {FortunaEntropy} from "../src/FortunaEntropy.sol";
import {CoinFlip} from "../src/CoinFlip.sol";

contract Deploy is Script {
    function run() external {
        address provider = vm.envOr("PROVIDER", address(0));
        bytes32 commitment = vm.envOr("PROVIDER_COMMITMENT", bytes32(0));
        uint128 fee = uint128(vm.envOr("PROVIDER_FEE", uint256(25_000_000_000_000))); // 0.000025 ETH

        vm.startBroadcast();
        CharacterNFT nft = new CharacterNFT();
        StakingPool pool = new StakingPool(address(nft));
        FortunaEntropy entropy = new FortunaEntropy();
        CoinFlip coinFlip = new CoinFlip(address(entropy), provider);

        // Convenience: pre-mint a few glyphs to the deployer.
        nft.ownerMint(msg.sender, 5);

        if (provider != address(0) && commitment != bytes32(0)) {
            entropy.registerProvider(provider, commitment, fee);
        }
        vm.stopBroadcast();

        console2.log("CharacterNFT  :", address(nft));
        console2.log("StakingPool   :", address(pool));
        console2.log("FortunaEntropy:", address(entropy));
        console2.log("CoinFlip      :", address(coinFlip));
        console2.log("Provider      :", provider);
    }
}
