#!/bin/bash

cd circuits
mkdir Withdraw

#to get trusted ceremony parameters (powers of tau)
if [ -f ./powersOfTau28_hez_final_14.ptau ]; then
    echo "powersOfTau28_hez_final_14.ptau already exists. Skipping."
else
    echo 'Downloading powersOfTau28_hez_final_14.ptau'
    wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_14.ptau
fi

echo "Compiling Withdraw.circom..."

# compile circuit

circom Withdraw.circom --r1cs --wasm --sym -o Withdraw
snarkjs r1cs info Withdraw/Withdraw.r1cs


# Start a new zkey and make a contribution

snarkjs groth16 setup Withdraw/Withdraw.r1cs powersOfTau28_hez_final_14.ptau Withdraw/circuit_0000.zkey  #start power of tau ceremony
snarkjs zkey contribute Withdraw/circuit_0000.zkey  Withdraw/circuit_final.zkey   --name="1st Contributor Name" -v -e="random text"  #phase 2 of trusted event (adding circuit dependent event)
snarkjs zkey export verificationkey Withdraw/circuit_final.zkey Withdraw/verification_key.json #export verification key

# generate solidity contract
snarkjs zkey export solidityverifier Withdraw/circuit_final.zkey ../contracts/Verifier.sol

cd ../..