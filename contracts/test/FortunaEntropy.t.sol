// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {FortunaEntropy} from "../src/FortunaEntropy.sol";
import {CoinFlip} from "../src/CoinFlip.sol";

contract MockConsumer {
    address public immutable entropy;
    uint256 public callCount;
    uint64 public lastSeq;
    address public lastProvider;
    bytes32 public lastRandom;

    constructor(address e) {
        entropy = e;
    }

    function entropyCallback(uint64 seq, address provider, bytes32 random) external {
        require(msg.sender == entropy, "only entropy");
        callCount++;
        lastSeq = seq;
        lastProvider = provider;
        lastRandom = random;
    }

    function getEntropy() external view returns (address) {
        return entropy;
    }
}

contract FortunaEntropyTest is Test {
    FortunaEntropy entropy;
    address provider = makeAddr("provider");
    address alice = makeAddr("alice");
    uint128 constant FEE = 25_000_000_000_000; // 0.000025 ETH

    bytes32 secret = bytes32(uint256(0xBEEF));
    bytes32 commitment = keccak256(abi.encodePacked(secret));

    function setUp() public {
        entropy = new FortunaEntropy();
        entropy.registerProvider(provider, commitment, FEE);
        vm.deal(alice, 1 ether);
    }

    function test_RequestAndRevealAdvancesChain() public {
        bytes32 userRandom = bytes32(uint256(0xCAFE));
        vm.prank(alice);
        uint64 seq = entropy.requestV2{value: FEE}(provider, userRandom, 200_000);

        vm.expectRevert(FortunaEntropy.IncorrectRevelation.selector);
        entropy.reveal(provider, seq, userRandom, bytes32(uint256(0xBADD)));

        entropy.reveal(provider, seq, userRandom, secret);

        (bytes32 newCommitment, , ) = entropy.getProviderInfo(provider);
        assertEq(newCommitment, secret, "commitment should advance to revealed preimage");

        FortunaEntropy.Request memory r = entropy.getRequest(seq);
        assertTrue(r.fulfilled, "fulfilled");
        assertFalse(r.refunded, "not refunded");
    }

    function test_CallbackDeliversRandom() public {
        MockConsumer consumer = new MockConsumer(address(entropy));
        bytes32 userRandom = bytes32(uint256(0x1234));
        vm.prank(alice);
        uint64 seq = entropy.requestV2{value: FEE}(provider, userRandom, 200_000);

        entropy.revealWithCallback(provider, seq, userRandom, secret, address(consumer));

        bytes32 expected = keccak256(abi.encodePacked(userRandom, secret));
        assertEq(consumer.callCount(), 1, "callback once");
        assertEq(consumer.lastRandom(), expected, "random delivered");
        assertEq(consumer.lastProvider(), provider, "provider delivered");
        assertEq(consumer.lastSeq(), seq, "seq delivered");
    }

    function test_RevertInsufficientFee() public {
        vm.prank(alice);
        vm.expectRevert(FortunaEntropy.InsufficientFee.selector);
        entropy.requestV2{value: FEE - 1}(provider, bytes32(uint256(1)), 200_000);
    }

    function test_RevertNoSuchProvider() public {
        vm.prank(alice);
        vm.expectRevert(FortunaEntropy.NoSuchProvider.selector);
        entropy.requestV2{value: FEE}(makeAddr("ghost"), bytes32(uint256(1)), 200_000);
    }

    function test_RefundAfterDelay() public {
        bytes32 userRandom = bytes32(uint256(0x9999));
        vm.prank(alice);
        uint64 seq = entropy.requestV2{value: FEE}(provider, userRandom, 200_000);

        vm.expectRevert(FortunaEntropy.RefundTooEarly.selector);
        vm.prank(alice);
        entropy.refundRequest(provider, seq);

        vm.roll(block.number + entropy.refundDelayBlocks() + 1);

        vm.prank(alice);
        entropy.refundRequest(provider, seq);

        FortunaEntropy.Request memory r = entropy.getRequest(seq);
        assertTrue(r.refunded, "refunded");
        assertEq(alice.balance, 1 ether, "fee returned");
    }

    function test_CoinFlipResolves() public {
        CoinFlip coin = new CoinFlip(address(entropy), provider);
        vm.prank(alice);
        uint64 seq = coin.flip{value: FEE}();

        bytes32 userRandom = entropy.getRequest(seq).userRandomNumber;
        entropy.reveal(provider, seq, userRandom, secret);

        bool expectedHeads = uint256(keccak256(abi.encodePacked(userRandom, secret))) % 2 == 0;
        assertTrue(coin.resolved(seq), "resolved");
        assertEq(coin.players(seq), alice, "player recorded");
        assertEq(coin.heads(seq), expectedHeads, "heads matches");
    }
}
