// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ListrackMerkle
/// @notice Single source of truth for the Merkle scheme shared by AlienListrack,
///         DrexListrack (MainListrack) and MerkleContract (MainMerkle).
///
/// Scheme (Section 4.3 of the paper):
///   leaf      = keccak256(0x00 || TxId)
///   node      = keccak256(0x01 || left || right)
///   odd level = the last node is paired with itself
///   committed = keccak256(0x02 || leafCount || treeRoot)
///
/// Domain separation stops an internal node from being presented as a leaf.
/// Binding the leaf count into the committed root fixes the tree shape, so the
/// verifier can require the exact proof length and a leaf index below the count.
/// This removes the duplicated-last-node ambiguity (the pattern behind
/// CVE-2012-2459 in Bitcoin).
library ListrackMerkle {

    function leafHash(bytes32 txId) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(bytes1(0x00), txId));
    }

    function nodeHash(bytes32 left, bytes32 right) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(bytes1(0x01), left, right));
    }

    function commit(uint256 leafCount, bytes32 treeRoot) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(bytes1(0x02), leafCount, treeRoot));
    }

    /// @notice Number of sibling hashes in a proof for a tree of `leafCount` leaves.
    function depth(uint256 leafCount) internal pure returns (uint256 d) {
        uint256 size = leafCount;
        while (size > 1) {
            size = (size + 1) / 2;
            d++;
        }
    }

    /// @notice Committed root of a list of transaction identifiers.
    function committedRoot(bytes32[] memory txIds) internal pure returns (bytes32) {
        uint256 n = txIds.length;
        require(n > 0, "No data to create Merkle tree");
        bytes32[] memory level = new bytes32[](n);
        for (uint256 i = 0; i < n; i++) level[i] = leafHash(txIds[i]);
        while (level.length > 1) {
            uint256 m = (level.length + 1) / 2;
            bytes32[] memory next = new bytes32[](m);
            for (uint256 i = 0; i < level.length; i += 2) {
                bytes32 right = (i + 1 < level.length) ? level[i + 1] : level[i];
                next[i / 2] = nodeHash(level[i], right);
            }
            level = next;
        }
        return commit(n, level[0]);
    }

    /// @notice Sibling path for the leaf at `index`. For the last node of an odd
    ///         level the sibling is the node itself.
    function proof(bytes32[] memory txIds, uint256 index) internal pure returns (bytes32[] memory path) {
        uint256 n = txIds.length;
        require(index < n, "Leaf index out of range");
        path = new bytes32[](depth(n));
        bytes32[] memory level = new bytes32[](n);
        for (uint256 i = 0; i < n; i++) level[i] = leafHash(txIds[i]);
        uint256 k = 0;
        while (level.length > 1) {
            uint256 sib = (index % 2 == 0) ? index + 1 : index - 1;
            path[k++] = (sib < level.length) ? level[sib] : level[index];
            uint256 m = (level.length + 1) / 2;
            bytes32[] memory next = new bytes32[](m);
            for (uint256 i = 0; i < level.length; i += 2) {
                bytes32 right = (i + 1 < level.length) ? level[i + 1] : level[i];
                next[i / 2] = nodeHash(level[i], right);
            }
            level = next;
            index /= 2;
        }
    }

    /// @notice Recomputes the committed root from a leaf and its proof.
    /// @return ok   false if the proof is malformed for this leaf count
    /// @return root the committed root (meaningful only when ok is true)
    function computeRoot(bytes32 txId, uint256 index, uint256 leafCount, bytes32[] memory path)
        internal pure returns (bool ok, bytes32 root)
    {
        if (leafCount == 0 || index >= leafCount) return (false, bytes32(0));
        if (path.length != depth(leafCount)) return (false, bytes32(0));
        bytes32 h = leafHash(txId);
        uint256 size = leafCount;
        for (uint256 k = 0; k < path.length; k++) {
            if (index % 2 == 0) {
                if (index + 1 == size) {
                    // last node of an odd level: must be paired with itself
                    if (path[k] != h) return (false, bytes32(0));
                }
                h = nodeHash(h, path[k]);
            } else {
                h = nodeHash(path[k], h);
            }
            index /= 2;
            size = (size + 1) / 2;
        }
        return (true, commit(leafCount, h));
    }
}
