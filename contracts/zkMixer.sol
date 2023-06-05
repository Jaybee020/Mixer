// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "./MerkleTree.sol";

import "./ReentrancyGuard.sol";
import "./Verifier.sol";


interface IVerifier {
function verifyProof(
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[2] memory input
        ) external view returns (bool r) ;
}

contract zkMixer is Tree, ReentrancyGuard {
  IVerifier public verifier;//verifier contract deployed for proof verification
  uint256 public denomination;//amount to deposit into the contract

  mapping(uint256 => bool) public nullifierHashes;
  // we store all commitments just to prevent accidental deposits with the same commitment
  mapping(uint256 => bool) public commitments;

  event Deposit(uint256 indexed commitment, uint256 leafIndex, uint256 timestamp);
  event Withdrawal(address to, uint256 nullifierHash, address indexed relayer, uint256 fee);


    constructor(
    address _verifier,
    uint256 _denomination,
    uint32 _depth
  ) Tree(_depth) {
    require(_denomination > 0, "denomination should be greater than 0");
    verifier = IVerifier(_verifier);
    denomination = _denomination;
  }

  function getDenomination() public view returns(uint256){
    return denomination;
  }

function deposit(uint256 _commitment) public payable nonReentrant{
    require(!commitments[_commitment],"Commitment has been used previously");
    require(msg.value== denomination,"Send the correct deposit amount to the contract");

    // tree.insert(_commitment);//insert the new commitment to the leaf
    insertLeaf(_commitment);
    commitments[_commitment]=true;//update commitment value state
    uint newIndex=getIndex();
    emit Deposit(_commitment, newIndex, block.timestamp);
}


    //to withdraw proof is submitted and validated
    function withdraw(
            address payable to,//address of receiver of deposited amount
            uint256 fee,//fee to pay relayer
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[2] memory input
        ) public payable nonReentrant returns (bool)  {
        require(verifier.verifyProof(a, b, c, input),"Wrong proof sent");//takes in root variable from input checks if it is equal to state variable root
        require(!nullifierHashes[input[1]],"nullifier Hash has been used");
        require(isKnownRoot((input[0])),"Use a known or recent root");
        nullifierHashes[input[1]]=true;
        to.transfer(denomination-fee);
        if(fee>0){
            payable(msg.sender).transfer(fee);//pay relayer if fee is greater than 0 
        }
        emit Withdrawal(to, input[1],msg.sender,fee);//emit withdrawal
        return true;

}}