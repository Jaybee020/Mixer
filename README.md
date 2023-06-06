# Zero-Knowledge Mixer

# Install Dependencies

```http
  npm install
```

# Project Structure

This project is made up of 3 main folders

- circuit
- contracts
- frontend

## Circuit

The circuit folder contains the circuits used in the mixer.Set the depth of the tree(default is 25 max is 32) .The circuits generate a merkle inclusion proof in order to process withdrawals.

To compile the circuit

-Install circom. Find more info [here](https://docs.circom.io/getting-started/installation/).

- Run `bash scripts/compile.sh`. This also generates the Verifier.sol file. Change the solidity version of the verifier.sol file to 0.8.4. This command also generates a proof generation key called circuit_final.zkey and Withdraw.wasm(in the Withdraw js folder). They should be copied to the frontend code to generate the proofs depending on the users input.

## Contracts

This folder contains all contracts used for the mixer. The Verifer.sol was generated using snark js. The zkMixer contract extends both the Verifier and MerkleTree contracts. To deploy the contracts,

- Configure your hardhat.config.ts file,the current one there deploys to the sepolia testnet. Set your mainnet rpc url and your private key in the .env file.

- Go to the deploy.ts file in the scripts folder. Set your deposit amount in ethers and your tree depth(max is 32, but reasonable is 25 ,it should be the same value as the one in the Withdraw.circom file). A different contract is to be used for several deposit amounts.

To deploy the contract run the following command in the terminal

```bash
npx hardhat run --network <your-network> scripts/deploy.ts
```

For mainnet replace the your-network with mainnet, for sepolia deployment replace it with sepolia(as set in your hardhat config file). E.g

```
npx hardhat run --network mainnet scripts/deploy.js

```

For the first deployment, the following message is logged,

```bash
poseidon contract deployed at  THE_DEPLOYED_ADDRESS
Verifier contract deployed at THE_DEPLOYED_ADDRESS. Incremental Binary Tree deployed at THE_DEPLOYED_ADDRESS
Mixer contract has been deployed to THE_DEPLOYED_ADDRESS
```

For further deployments,the poseidon,verifer and incremental binary tree contracts do not need to be redeployed, and their addresses can be set directly already in deploy.ts file.

```ts
async function deployMixer() {
  //uncomment for first deployment

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

  // //The incremental binary tree,poseidon and verifier contract should only be deployed once. Can be commented out after deployed once and addresses are saved
  // console.log(
  //   `Verifier contract deployed at ${VerifierContract.address}. Incremental Binary Tree deployed at ${incrementalBinaryTreeLib.address}`
  // );

  //For further deployemnts the above code can be commented out, but should be run for only the first deployment

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
}
```

The mixer addresses for the several deposit amounts should be noted and recorded.

### Run Tests

To run contracts test

```
  npx hardhat tests
```

## Frontend

This contains the UI of the project.It was written in react. To start the server

Cd into the directory

```
  cd frontend
```

The functions used are in the src directory and in the helpers folder. This code only supports a single deposit amount, to support multiple, your code should be able to dynamically select the contract addresses for the deposit amount you want to interact with(maybe via a dropdown and mapping the depositAMounts to their contract address). You should also copy the circuit_final.zkey and Withdraw.wasm(in the Withdraw js folder) to the public folder to help with proof generation on the client side.

Install Dependencies

```
    npm install
```

Start Server

```
  npm start
```
