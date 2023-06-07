import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
const buildPoseidon = require("circomlibjs").buildPoseidon;
const { poseidonContract } = require("circomlibjs");

async function deployMixer() {
  // const poseidon = await buildPoseidon();
  // const F = poseidon.F;
  // const PoseidonT3 = await ethers.getContractFactory(
  //   poseidonContract.generateABI(2),
  //   poseidonContract.createCode(2)
  // );
  // const poseidonT3 = await PoseidonT3.deploy();
  // await poseidonT3.deployed();

  // console.log("poseidon contract deployed at ", poseidonT3.address);
  // const IncrementalBinaryTreeLibFactory = await ethers.getContractFactory(
  //   "IncrementalBinaryTree",
  //   {
  //     libraries: {
  //       PoseidonT3: poseidonT3.address,
  //     },
  //   }
  // );

  // const incrementalBinaryTreeLib =
  //   await IncrementalBinaryTreeLibFactory.deploy();

  // await incrementalBinaryTreeLib.deployed();

  // const VerifierFactory = await ethers.getContractFactory("Verifier");
  // const VerifierContract = await VerifierFactory.deploy();
  // await VerifierContract.deployed();

  //The incremental binary tree,poseidon and verifier contract should only be deployed once. Can be commented out after deployed once and addresses are saved
  // console.log(
  //   `Verifier contract deployed at ${VerifierContract.address}. Incremental Binary Tree deployed at ${incrementalBinaryTreeLib.address}`
  // );

  const zkMixerFactory = await ethers.getContractFactory("zkMixer", {
    libraries: {
      IncrementalBinaryTree: "0x4a0a5D875322De27e170f7c6E3678d47f711A50F", //replace with Binary tree Contract address on console after first deployment
    },
  });

  //   poseidon contract deployed at  0xF2E505107bbD79D9eb0C4EF475623A71BcDF6DE1
  // Verifier contract deployed at 0x84aDFe56fC50d58Ab4Bf65E2e4237d2a49602b34. Incremental Binary Tree deployed at 0x4a0a5D875322De27e170f7c6E3678d47f711A50F
  // Mixer contract has been deployed to 0xbA58d31C94A022E4FAF04626F1e84A309d49A6e0 0.1 eth

  // Mixer contract has been deployed to 0x500390299D3da7470805Af480D9dC759925F0C2C 1eth
  // Mixer contract has been deployed to 0x00cF7F2EC08253D4cfd37053A7133Eb96865c365 10eth

  // Mixer contract has been deployed to 0x67373DabEB511753A430e4C344c540653940bd26 100 eth

  //0.1,1,10,100
  const denominationAmount = parseEther("100"); //set deposit amount here in ethers
  const depth = 25; //set tree depth

  const zkMixer = await zkMixerFactory.deploy(
    "0x84aDFe56fC50d58Ab4Bf65E2e4237d2a49602b34", //replace with Verifier Contract address on console after first deployment
    denominationAmount,
    depth
  );
  await zkMixer.deployed();

  // const Mixer = await ethers.getContractFactory("Mixer", {
  //   libraries: {
  //     PoseidonT3: poseidonT3.address,
  //   },
  // });
  // const mixer = await Mixer.deploy(8);
  // await mixer.deployed();
  return zkMixer;
}

(async function run() {
  const mixer = await deployMixer();
  console.log("Mixer contract has been deployed to " + mixer.address);
})();
