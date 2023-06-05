//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "./Merkle.sol";

contract Mixer is MerkleTree{
    constructor(uint n) MerkleTree(n){ }//to initialze merkle tree

    uint256 public depositAmount=0.01 ether;
    mapping(uint256 => bool) public nullifierHashes;//to store nullifier hashes and check if it has been used(to prevent double withdrawal)
    // to prevent accidental deposits with the same commitment
     mapping(uint256 => bool) public commitments;

    event Deposit(uint commitment, uint256 leafIndex, uint256 timestamp);
    event Withdrawal(address to, uint256 nullifierHash);

    function deposit(uint _commitment) public payable{
        require(!commitments[_commitment],"Commitment has been used previously");
        require(msg.value==depositAmount,"Send 10 ONEs to the contract");

        uint256 index=insertLeaf(_commitment);//insert the new commitment to the leaf
        commitments[_commitment]=true;//update commitment value state
        emit Deposit(_commitment, index, block.timestamp);
    }

    //to withdraw proof is submitted and validated
    function withdraw(
            address payable to,//address of receiver of deposited amount
            uint256 fee,//fee to pay relayer
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[2] memory input
        ) public payable returns (bool) {
        require(verifyProof(a, b, c, input) ,"Wrong proof sent");//takes in root variable from input checks if it is equal to state variable root
        require(!nullifierHashes[input[1]],"nullifier Hash has been used");
        nullifierHashes[input[1]]=true;
        to.transfer(depositAmount-fee);
        if(fee>0){
            payable(msg.sender).transfer(fee);//pay relayer if fee is greater than 0 
        }
        emit Withdrawal(to, input[1]);//emit withdrawal
        return true;

    }


}