/* eslint-disable no-undef */
import { buildPoseidon } from "circomlibjs";
import { groth16 } from "snarkjs";
import { IncrementalMerkleTree } from "@zk-kit/incremental-merkle-tree";
import { Interface, hexZeroPad } from "ethers/lib/utils";
const { Contract, providers, utils } = require("ethers");
const Mixer = require("./Mixer.json");

function unstringifyBigInts(o) {
  if (typeof o == "string" && /^[0-9]+$/.test(o)) {
    return BigInt(o);
  } else if (typeof o == "string" && /^0x[0-9a-fA-F]+$/.test(o)) {
    return BigInt(o);
  } else if (Array.isArray(o)) {
    return o.map(unstringifyBigInts);
  } else if (typeof o == "object") {
    if (o === null) return null;
    const res = {};
    const keys = Object.keys(o);
    keys.forEach((k) => {
      res[k] = unstringifyBigInts(o[k]);
    });
    return res;
  } else {
    return o;
  }
}

function convert(F, value) {
  if (typeof value == "bigint") {
    return String(value);
  }
  return String(F.toObject(value));
}

export function getProvider(networkUrl) {
  return new providers.JsonRpcProvider(networkUrl);
}

export async function getMixer() {
  const provider = getProvider("https://rpc2.sepolia.org");
  const mixer = new Contract(
    "0xFCbd8C11e8dE65D927908bEC284D227f5531F0C4",
    Mixer.abi,
    provider
  );

  return mixer;
}

//this process can be done by a server to make it more efficient
async function fetchLogs(params) {
  //Queries the logs of an EVM contract
  const provider = await getProvider("https://rpc2.sepolia.org");
  const contractIface = new Interface(params.abi);
  const eventId = contractIface.getEventTopic(params.eventName);
  const topics = params.topics.map((topic) =>
    topic == null ? null : hexZeroPad(topic, 32)
  );
  var startBlock = params.fromBlock;
  var untilBlock =
    params.toBlock === "latest"
      ? (await provider.getBlockNumber()) || 0
      : params.toBlock;
  const filter = {
    address: params.contractAddr,
    topics: [eventId, ...topics],
    toBlock: untilBlock,
    fromBlock: startBlock,
  };
  try {
    const logData = await provider.getLogs(filter);
    return logData;
  } catch (error) {
    console.log(error);
    const errorMessage =
      JSON.parse(error.body).error.message ||
      error?.error?.message ||
      error?.data?.message ||
      error?.message;
    if (
      !errorMessage.includes("Log response size exceeded") &&
      !errorMessage.includes("query returned more than 10000 results")
    ) {
      throw new Error("Error fetching logs due to" + error?.error?.message);
    }
    await sleep(0.5);
    const middle = Math.floor((startBlock + untilBlock) / 2);
    const lowerPromise = fetchLogs({
      contractAddr: params.contractAddr,
      abi: params.abi,
      eventName: params.eventName,
      topics: params.topics,
      fromBlock: params.fromBlock,
      toBlock: middle,
    });
    const upperPromise = fetchLogs({
      contractAddr: params.contractAddr,
      abi: params.abi,
      eventName: params.eventName,
      topics: params.topics,
      fromBlock: middle,
      toBlock: params.toBlock,
    });
    const [lowerLog, upperLog] = await Promise.all([
      lowerPromise,
      upperPromise,
    ]);
    return [...lowerLog, ...upperLog];
  }
}

export async function getLeaves(mixer) {
  const contractIface = new Interface(Mixer.abi);
  console.log("Getting contract state...");
  const fromBlock = 3595561; //set from block to a recent block to prevent fetching from root
  const params = {
    abi: Mixer.abi,
    contractAddr: mixer.address,
    eventName: "Deposit",
    topics: [],
    fromBlock: fromBlock,
    toBlock: "latest",
  };

  const events = (await fetchLogs(params)).map((log) =>
    contractIface.decodeEventLog("Deposit", log.data, log.topics)
  );
  console.log(events);
  const leaves = events
    .sort((a, b) => a.leafIndex - b.leafIndex) // Sort events in chronological order
    .map((e) => e.commitment);

  return leaves;
}

export async function getSolidityCallData(mixer, secret, nullifier) {
  const poseidon = await buildPoseidon();
  const F = poseidon.F;
  // const hashes = await mixer.getHashes();
  const root = await mixer.getRoot();
  const commitment = F.toObject(poseidon([secret, nullifier]));
  let nullifierHash = F.toObject(poseidon([nullifier]));
  const treeDepth = 25; //get the tree depth deployed
  const tree = new IncrementalMerkleTree(poseidon, treeDepth, BigInt(0), 2);
  const leafs = await getLeaves(mixer);

  leafs.forEach((leaf) => {
    tree.insert(BigInt(leaf.toString()));
  });
  const index = tree.indexOf(commitment);
  const inclusionProof = tree.createProof(index);
  const path_index = inclusionProof.pathIndices.map(String);
  const path_elements = inclusionProof.siblings.flat().map((sibling) => {
    return convert(F, sibling);
  });

  const Input = {
    nullifier: nullifier.toString(),
    secret: secret.toString(),
    path_elements: path_elements,
    path_index: path_index,
    root: convert(F, tree.root),
    nullifierHash: String(nullifierHash),
  };
  var { proof, publicSignals } = await groth16.fullProve(
    Input,
    "../../Withdraw.wasm",
    "../../circuit_final.zkey"
  );
  const editedPublicSignals = unstringifyBigInts(publicSignals);
  const editedProof = unstringifyBigInts(proof);
  const calldata = await groth16.exportSolidityCallData(
    editedProof,
    editedPublicSignals
  );
  const argv = calldata
    .replace(/["[\]\s]/g, "")
    .split(",")
    .map((x) => BigInt(x).toString());

  const a = [argv[0], argv[1]];
  const b = [
    [argv[2], argv[3]],
    [argv[4], argv[5]],
  ];
  const c = [argv[6], argv[7]];
  const input = argv.slice(8);
  console.log(a, b, c, input);
  return [a, b, c, input];
}

export async function encodeCallData(to, fee, a, b, c, input) {
  let ABI = [
    "function withdraw(address payable to,uint256 fee, uint[2] memory a,uint[2][2] memory b,uint[2] memory c,uint[2] memory input)",
  ];
  let iface = new utils.Interface(ABI);
  const callData = iface.encodeFunctionData("withdraw", [
    to,
    fee,
    a,
    b,
    c,
    input,
  ]);
  return callData;
}

export async function getRelayers(n = 1) {}

export async function submitTx(relayerAddr, txn) {}
