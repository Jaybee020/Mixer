//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { PoseidonT3 } from "./Poseidon.sol"; //an existing library to perform Poseidon hash on solidity
import "./Verifier.sol"; //inherits with the MerkleTreeInclusionProof verifier contract

contract MerkleTree is Verifier{
    uint256[] private hashes; // the Merkle tree in flattened array form
    uint256 private depth;//represents the depth of the Merkle tree
    mapping(uint256 => uint256) public roots;//to store previous roots
    uint32 public constant ROOT_HISTORY_SIZE = 30;
    uint256 private index = 0; // the current index of the first unfilled leaf
    uint256 private root; // the current Merkle root

    constructor(uint n) {
        uint256 length=2**n;
         for(uint256 i=0;i<length;){
            hashes.push(0);//putting zero in the hashes root array
            unchecked {
                ++i;
            }
        }
        uint256 intermedateHashes=(length/2)-1;
        uint256 leafHashes=length/2;
        //do the first set of hashing
        for (uint i=0;i<leafHashes;){
            hashes.push(PoseidonT3.poseidon([hashes[i*2],hashes[(i*2)+1]]));
            unchecked {
                ++i;
            }
        }
       for(uint i=leafHashes;i<leafHashes+intermedateHashes;){
           hashes.push(PoseidonT3.poseidon([hashes[(i)*2],hashes[(i*2) + 1]]));
           unchecked {
               ++i;
           }
       }
       depth=n;
       root=hashes[hashes.length -1];
    }

    function insertLeaf(uint256 hashedLeaf) public returns (uint256) {
        require(index+1 != (2)**depth, "Merkle tree is full");
        hashes[index]=hashedLeaf;//replacing the 0 index with the new parameter
        //recompute root
        //Make efficient later
        uint256 length=2**depth;
        uint256 intermedateHashes=(length/2)-1;
        uint256 leafHashes=length/2;
        //replace each hash element
        for (uint i=0;i<leafHashes;){
            hashes[length+i]=PoseidonT3.poseidon([hashes[i*2],hashes[(i*2)+1]]);
            unchecked {
                ++i;
            }
        }
       for(uint i=leafHashes;i<leafHashes+intermedateHashes;){
           hashes[length+i]=PoseidonT3.poseidon([hashes[(i)*2],hashes[(i*2) + 1]]);
           unchecked {
               ++i;
           }
       }
       root=hashes[hashes.length -1];
       roots[index]=root;//store root at that point in time
       index++;
       return index;
    }

    function getIndex() public view returns(uint256){
        return index;
    }

    function getHashes()public view returns(uint256[] memory){
        return hashes;
    }

    function getRoot()public view returns(uint256){
        return root;
    }
    function verifyLeaf(
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[2] memory input
        ) public view returns (bool) {

        return verifyProof(a, b, c, input) && (input[0]==root);//takes in root variable from input checks if it is equal to state variable root

    }

}
