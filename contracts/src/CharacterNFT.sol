// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {GlyphArt} from "./GlyphArt.sol";

/// @title CharacterNFT
/// @notice Fully on-chain, deterministic Braille-glyph NFT collection.
///         The art is generated from the token id and rendered as an inline SVG in
///         tokenURI, so it displays identically on OpenSea and in our frontend.
contract CharacterNFT is ERC721, ERC721Enumerable, Ownable {
    using Strings for uint256;

    uint256 public constant MAX_SUPPLY = 1024;
    uint256 public constant MAX_PER_WALLET = 10;
    uint256 public constant COLOR_COUNT = 16;
    uint256 public constant FONT = 20; // px per braille cell in the SVG

    uint256 private _nextId;

    event Minted(address indexed to, uint256 indexed tokenId);

    constructor() ERC721("Glyph", "GLYPH") Ownable(msg.sender) {}

    function mint() external {
        require(_nextId < MAX_SUPPLY, "sold out");
        require(balanceOf(msg.sender) < MAX_PER_WALLET, "wallet limit");
        _mintTo(msg.sender);
    }

    function ownerMint(address to, uint256 amount) external onlyOwner {
        for (uint256 i = 0; i < amount; i++) {
            require(_nextId < MAX_SUPPLY, "sold out");
            _mintTo(to);
        }
    }

    function _mintTo(address to) internal {
        uint256 tokenId = _nextId++;
        _safeMint(to, tokenId);
        emit Minted(to, tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        string memory svg = renderSvg(tokenId);
        string memory json = string(
            abi.encodePacked(
                '{"name":"Glyph #',
                tokenId.toString(),
                '","description":"A fixed Braille portrait, tinted per token. Stake it to farm points.",',
                '"image":"data:image/svg+xml;base64,',
                Base64.encode(bytes(svg)),
                '","attributes":[{"trait_type":"Color","value":"',
                _colorName(_colorIndex(tokenId)),
                '"}]}'
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    function renderSvg(uint256 tokenId) public view returns (string memory) {
        _requireOwned(tokenId);
        bytes memory art = GlyphArt.DATA;
        uint256 w = GlyphArt.WIDTH * FONT;
        uint256 h = GlyphArt.HEIGHT * FONT;
        uint256 mid = w / 2;
        string memory out = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" width="',
                w.toString(),
                '" height="',
                h.toString(),
                '" viewBox="0 0 ',
                w.toString(),
                ' ',
                h.toString(),
                '">',
                '<rect width="100%" height="100%" fill="#000000"/>',
                '<g font-family="DejaVu Sans Mono,Noto Sans Mono,monospace" font-size="',
                FONT.toString(),
                '" fill="#',
                _colorHex(_colorIndex(tokenId)),
                '">'
            )
        );

        for (uint256 r = 0; r < GlyphArt.HEIGHT; r++) {
            out = string(
                abi.encodePacked(
                    out,
                    '<text x="',
                    mid.toString(),
                    '" y="',
                    (r * FONT + FONT).toString(),
                    '" text-anchor="middle">',
                    _row(art, r),
                    "</text>"
                )
            );
        }

        return string(abi.encodePacked(out, "</g></svg>"));
    }

    /// @notice Raw art data for the frontend: braille bytes + dimensions + per-token color.
    function artData(uint256 tokenId)
        external
        view
        returns (bytes memory data, uint8 width, uint8 height, uint8 colorIdx)
    {
        _requireOwned(tokenId);
        return (GlyphArt.DATA, uint8(GlyphArt.WIDTH), uint8(GlyphArt.HEIGHT), _colorIndex(tokenId));
    }

    /// @dev Build the UTF-8 braille string for a single row (3 bytes per cell).
    function _row(bytes memory art, uint256 r) internal pure returns (string memory) {
        bytes memory out = new bytes(GlyphArt.WIDTH * 3);
        for (uint256 c = 0; c < GlyphArt.WIDTH; c++) {
            uint8 v = uint8(art[r * GlyphArt.WIDTH + c]);
            out[c * 3] = bytes1(0xE2);
            out[c * 3 + 1] = bytes1(0xA0 | (v >> 6));
            out[c * 3 + 2] = bytes1(0x80 | (v & 0x3F));
        }
        return string(out);
    }

    function _colorIndex(uint256 tokenId) internal pure returns (uint8) {
        return uint8(tokenId % COLOR_COUNT);
    }

    function _colorHex(uint8 i) internal pure returns (string memory) {
        if (i == 0) return "ffffff";
        if (i == 1) return "ff4d4d";
        if (i == 2) return "ff9f1a";
        if (i == 3) return "ffe14d";
        if (i == 4) return "4dff4d";
        if (i == 5) return "4dffff";
        if (i == 6) return "4d6bff";
        if (i == 7) return "b34dff";
        if (i == 8) return "ff4dff";
        if (i == 9) return "ff8c8c";
        if (i == 10) return "b4ff4d";
        if (i == 11) return "4dffb3";
        if (i == 12) return "4db3ff";
        if (i == 13) return "b3b3ff";
        if (i == 14) return "ffb3f0";
        return "e6e6e6";
    }

    function _colorName(uint8 i) internal pure returns (string memory) {
        if (i == 0) return "white";
        if (i == 1) return "red";
        if (i == 2) return "orange";
        if (i == 3) return "yellow";
        if (i == 4) return "green";
        if (i == 5) return "cyan";
        if (i == 6) return "blue";
        if (i == 7) return "purple";
        if (i == 8) return "magenta";
        if (i == 9) return "salmon";
        if (i == 10) return "lime";
        if (i == 11) return "mint";
        if (i == 12) return "sky";
        if (i == 13) return "lavender";
        if (i == 14) return "pink";
        return "silver";
    }

    // ERC721 + ERC721Enumerable overrides
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 amount)
        internal
        virtual
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, amount);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
