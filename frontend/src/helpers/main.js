import { buildPoseidon } from "circomlibjs";
const { Contract, providers, utils } = require("ethers");
const Mixer = require("./Mixer.json");
const { getSolidityCallData, encodeCallData, submitTx } = require("./helpers");

function getEth() {
  //@ts-ignore
  const eth = window.ethereum; //ethereum object is added to your window by metamask
  if (!eth) {
    throw new Error("Could not find metamask");
  }
  return eth;
}

//accounts that are in metamask
async function hasAccounts() {
  const eth = await getEth();
  const accounts = await eth.request({ method: "eth_accounts" });
  return accounts && accounts.length;
}

//you request an account from your metamask
async function requestAccounts() {
  const eth = await getEth();
  const accounts = await eth.request({
    method: "eth_requestAccounts",
  });
  return accounts && accounts.length;
}

export async function deposit(secret, nullifier) {
  if (!(await hasAccounts()) && !(await requestAccounts())) {
    //asking metamask for accounts in it and requesting the account
    throw new Error("Please install metamask");
  }

  const mixer = new Contract(
    "0xFCbd8C11e8dE65D927908bEC284D227f5531F0C4",
    Mixer.abi,
    new providers.Web3Provider(getEth()).getSigner()
  );
  const poseidon = await buildPoseidon();
  const F = poseidon.F;
  let commitment = F.toObject(poseidon([secret, nullifier]));
  const depositAmount = "0.02"; //await mixer.getDenomination();
  // const newIndex = await mixer.insertLeaf(commitment, {
  //   gasLimit: 30000000,
  // });
  // console.log(await newIndex.wait());
  await mixer.deposit(commitment, {
    value: utils.parseEther(depositAmount),
    gasLimit: 30000000,
  }); //set to deppsotAmount
}

export async function withdrawBySelf(secret, nullifier, to) {
  if (!(await hasAccounts()) && !(await requestAccounts())) {
    //asking metamask for accounts in it and requesting the account
    throw new Error("Please install metamask");
  }
  const mixer = new Contract(
    "0xFCbd8C11e8dE65D927908bEC284D227f5531F0C4",
    Mixer.abi,
    new providers.Web3Provider(getEth()).getSigner()
  );
  const [a, b, c, input] = await getSolidityCallData(mixer, secret, nullifier);
  const verifier = await mixer.verifier();
  console.log("Verifier is ", verifier);
  const receipt = await mixer.withdraw(to, 0, a, b, c, input);
  return "Successfully withdrew by self with hash" + receipt.msg;
}

export async function withdrawwithRelayer(
  secret,
  nullifier,
  to,
  fee,
  relayerAddr
) {}
