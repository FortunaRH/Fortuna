// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title StakingPool
/// @notice Stake CharacterNFTs to farm points. Points accrue per second while staked
///         and can be claimed at any time. Source of truth for points is on-chain.
contract StakingPool is Ownable, ReentrancyGuard {
    IERC721 public immutable nft;
    uint256 public pointsPerSecond = 10;

    struct Stake {
        address owner;
        uint256 startTime;
        uint256 lastClaim;
    }

    mapping(uint256 => Stake) public stakes;
    mapping(address => uint256[]) private _stakedBy;
    mapping(uint256 => uint256) private _idx;
    mapping(address => uint256) public claimed;

    uint256 public totalStaked;

    event Staked(address indexed user, uint256 indexed tokenId, uint256 at);
    event Unstaked(address indexed user, uint256 indexed tokenId, uint256 points);
    event Claimed(address indexed user, uint256 indexed tokenId, uint256 points);

    constructor(address nft_) Ownable(msg.sender) {
        nft = IERC721(nft_);
    }

    function setPointsPerSecond(uint256 rate) external onlyOwner {
        pointsPerSecond = rate;
    }

    function stake(uint256 tokenId) external nonReentrant {
        require(stakes[tokenId].owner == address(0), "already staked");
        nft.transferFrom(msg.sender, address(this), tokenId);
        uint256 t = block.timestamp;
        stakes[tokenId] = Stake(msg.sender, t, t);
        _stakedBy[msg.sender].push(tokenId);
        _idx[tokenId] = _stakedBy[msg.sender].length - 1;
        totalStaked += 1;
        emit Staked(msg.sender, tokenId, t);
    }

    function unstake(uint256 tokenId) external nonReentrant {
        Stake storage s = stakes[tokenId];
        require(s.owner == msg.sender, "not staker");
        uint256 earned = _pending(s, block.timestamp);
        claimed[msg.sender] += earned;
        _remove(msg.sender, tokenId);
        delete stakes[tokenId];
        totalStaked -= 1;
        nft.transferFrom(address(this), msg.sender, tokenId);
        emit Unstaked(msg.sender, tokenId, earned);
    }

    function claim(uint256 tokenId) external nonReentrant {
        Stake storage s = stakes[tokenId];
        require(s.owner == msg.sender, "not staker");
        uint256 earned = _pending(s, block.timestamp);
        s.lastClaim = block.timestamp;
        claimed[msg.sender] += earned;
        emit Claimed(msg.sender, tokenId, earned);
    }

    function pendingPoints(uint256 tokenId) public view returns (uint256) {
        Stake storage s = stakes[tokenId];
        if (s.owner == address(0)) return 0;
        return _pending(s, block.timestamp);
    }

    function pointsOf(address user) public view returns (uint256) {
        uint256 total = claimed[user];
        uint256[] storage ids = _stakedBy[user];
        for (uint256 i = 0; i < ids.length; i++) {
            total += _pending(stakes[ids[i]], block.timestamp);
        }
        return total;
    }

    function stakedTokensOf(address user) external view returns (uint256[] memory) {
        return _stakedBy[user];
    }

    function stakerOf(uint256 tokenId) external view returns (address) {
        return stakes[tokenId].owner;
    }

    function _pending(Stake storage s, uint256 at) internal view returns (uint256) {
        return (at - s.lastClaim) * pointsPerSecond;
    }

    function _remove(address user, uint256 tokenId) internal {
        uint256[] storage ids = _stakedBy[user];
        uint256 idx = _idx[tokenId];
        uint256 last = ids.length - 1;
        uint256 lastId = ids[last];
        ids[idx] = lastId;
        _idx[lastId] = idx;
        ids.pop();
        delete _idx[tokenId];
    }
}
