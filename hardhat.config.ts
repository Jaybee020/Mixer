import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "hardhat-gas-reporter";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = String(process.env.PRIVATE_KEY);

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    mainnet: {
      url: "https://mainnet.infura.io/v3/", //url link for mainnet
      accounts: [PRIVATE_KEY],
    },
    sepolia: {
      url: `https://rpc2.sepolia.org`, //link for rpcUrl of testnet
      accounts: [
        PRIVATE_KEY, //input your private key
      ],
    },
  },
};
