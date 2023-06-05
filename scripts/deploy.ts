import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
const buildPoseidon = require("circomlibjs").buildPoseidon;
const { poseidonContract } = require("circomlibjs");

async function deployMixer() {
  const poseidon = await buildPoseidon();
  const F = poseidon.F;
  const PoseidonT3 = await ethers.getContractFactory(
    poseidonContract.generateABI(2),
    poseidonContract.createCode(2)
  );
  const poseidonT3 = await PoseidonT3.deploy();
  await poseidonT3.deployed();

  console.log("poseidon contract deployed at ", poseidonT3.address);
  const IncrementalBinaryTreeLibFactory = await ethers.getContractFactory(
    "IncrementalBinaryTree",
    {
      libraries: {
        PoseidonT3: poseidonT3.address,
      },
    }
  );

  const incrementalBinaryTreeLib =
    await IncrementalBinaryTreeLibFactory.deploy();

  await incrementalBinaryTreeLib.deployed();

  const VerifierFactory = await ethers.getContractFactory("Verifier");
  const VerifierContract = await VerifierFactory.deploy();
  await VerifierContract.deployed();

  //The incremental binary tree,poseidon and verifier contract should only be deployed once. Can be commented out after deployed once and addresses are saved
  console.log(
    `Verifier contract deployed at ${VerifierContract.address}. Incremental Binary Tree deployed at ${incrementalBinaryTreeLib.address}`
  );

  const zkMixerFactory = await ethers.getContractFactory("zkMixer", {
    libraries: {
      IncrementalBinaryTree: incrementalBinaryTreeLib.address, //replace with Binary tree Contract address on console after first deployment
    },
  });

  const denominationAmount = parseEther("0.02"); //set deposit amount here in ethers
  const depth = 25; //set tree depth

  const zkMixer = await zkMixerFactory.deploy(
    VerifierContract.address, //replace with Verifier Contract address on console after first deployment
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
