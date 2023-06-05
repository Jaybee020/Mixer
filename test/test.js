const { poseidonContract } = require("circomlibjs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { groth16 } = require("snarkjs");
const { waffle } = require("hardhat");
const buildPoseidon = require("circomlibjs").buildPoseidon;

//
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

describe("Mixer", function () {
  let mixer;
  let poseidon;
  let F;

  beforeEach(async function () {
    poseidon = await buildPoseidon();
    F = poseidon.F;
    const PoseidonT3 = await ethers.getContractFactory(
      poseidonContract.generateABI(2),
      poseidonContract.createCode(2)
    );
    const poseidonT3 = await PoseidonT3.deploy();
    await poseidonT3.deployed();

    const Mixer = await ethers.getContractFactory("Mixer", {
      libraries: {
        PoseidonT3: poseidonT3.address,
      },
    });
    mixer = await Mixer.deploy(3);
    await mixer.deployed();
  });

  it("should add to mixer and withdraw", async function () {
    const secret = 1234;
    const nullifier = 1234567;
    let commitment = F.toObject(poseidon([secret, nullifier]));
    await mixer.deposit(commitment, {
      value: ethers.utils.parseEther("10"),
    });
    const index = await mixer.getIndex();
    const hashes = await mixer.getHashes();
    const root = await mixer.getRoot();
    let nullifierHash = F.toObject(poseidon([nullifier]));
    expect(hashes[parseInt(index) - 1]).to.equal(commitment);
    console.log(String(hashes[9]), String(hashes[13]));

    const Input = {
      nullifier: nullifier.toString(),
      secret: secret.toString(),
      path_elements: ["0", String(hashes[9]), String(hashes[13])],
      path_index: ["0", "0", "0"],
      root: String(root),
      nullifierHash: String(nullifierHash),
    };
    var { proof, publicSignals } = await groth16.fullProve(
      Input,
      "circuits/Withdraw/Withdraw_js/Withdraw.wasm",
      "circuits/Withdraw/circuit_final.zkey"
    );
    console.log(publicSignals[0]);
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
    const recipient = "0xDeaD00000000000000000000000000000000BEEf";

    await mixer.withdraw(recipient, 0, a, b, c, input);
    const provider = waffle.provider;

    const recipientBalance = await provider.getBalance(recipient);
    expect(parseInt(recipientBalance)).to.equal(1e19);
  });

  it("should fail at deposit due to wrong deposit", async function () {
    let e;
    try {
      const secret = 1234;
      const nullifier = 1234567;
      let commitment = F.toObject(poseidon([secret, nullifier]));
      await mixer.deposit(commitment, {
        value: ethers.utils.parseEther("0.004"),
      });
    } catch (error) {
      e = error;
    }
  });

  it("should add to mixer and fail at withdraw", async function () {
    let e;
    try {
      const secret = 1234;
      const nullifier = 1234567;
      let commitment = F.toObject(poseidon([secret, nullifier]));
      await mixer.deposit(commitment, {
        value: ethers.utils.parseEther("0.1"),
      });
      const index = await mixer.getIndex();
      const hashes = await mixer.getHashes();
      const root = await mixer.getRoot();
      let nullifierHash = F.toObject(poseidon([nullifier]));
      expect(hashes[parseInt(index) - 1]).to.equal(commitment);
      console.log(String(hashes[9]), String(hashes[13]));

      const a = [0, 0];
      const b = [
        [0, 0],
        [0, 0],
      ];
      const c = [0, 0];
      const input = [0, 0];
      const recipient = "0xDeaD00000000000000000000000000000000BEEf";

      await mixer.withdraw(recipient, a, b, c, input);
    } catch (error) {
      e = error;
    }
  });
});
