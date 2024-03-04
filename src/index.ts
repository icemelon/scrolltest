import { JsonFragment } from "@ethersproject/abi";
import { constants, Contract, providers } from "ethers";
import { concat } from "ethers/lib/utils";

const abi: Array<JsonFragment> = [
  {
    inputs: [
      { internalType: "address", name: "_poseidon", type: "address" },
      { internalType: "address", name: "_rollup", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "poseidon",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "rollup",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "batchIndex", type: "uint256" },
      { internalType: "address", name: "account", type: "address" },
      { internalType: "bytes32", name: "storageKey", type: "bytes32" },
      { internalType: "bytes", name: "proof", type: "bytes" },
    ],
    name: "verifyStateCommitment",
    outputs: [{ internalType: "bytes32", name: "storageValue", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "bytes32", name: "storageKey", type: "bytes32" },
      { internalType: "bytes", name: "proof", type: "bytes" },
    ],
    name: "verifyZkTrieProof",
    outputs: [
      { internalType: "bytes32", name: "stateRoot", type: "bytes32" },
      { internalType: "bytes32", name: "storageValue", type: "bytes32" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

async function main() {
//   const account = constants.AddressZero;
  const storage = constants.HashZero;
  const batchIndex = 100579
  //   Sepolia
  //   const fooAddress ='0xadbb7d8ae892c017d387dd26ff24fce79212932c'
  //   Scroll Sepolia
  //   https://sepolia.scrollscan.dev/address/0x94fbce7ca1a0152cfc99f90f4421d31cf356c896#code
  const fooAddress = '0x94fbce7ca1a0152cfc99f90f4421d31cf356c896'
  const account = fooAddress;
  // Note that currently, the public rpc does not support `eth_getProof` method.
  const L1_PROVIDER_URL = process.env.L1_PROVIDER_URL;
//   console.log(1, L1_PROVIDER_URL)
  const l1provider = new providers.JsonRpcProvider(L1_PROVIDER_URL);
  const l2provider = new providers.JsonRpcProvider("https://sepolia-rpc.scroll.io");
  console.log(2, {account, storage})
  const proof = await l2provider.send("eth_getProof", [account, [storage], "latest"]);
  console.log(3, JSON.stringify(proof, null, 2))
  const accountProof: Array<string> = proof.accountProof;
  const storageProof: Array<string> = proof.storageProof[0].proof;
  console.log(4, {accountProof})
  console.log(5, {storageProof})
  const compressedProof = concat([
    `0x${accountProof.length.toString(16).padStart(2, "0")}`,
    ...accountProof,
    `0x${storageProof.length.toString(16).padStart(2, "0")}`,
    ...storageProof,
  ]);
  console.log(6, {compressedProof})
  const verifier = new Contract("0x64cb3A0Dcf43Ae0EE35C1C15edDF5F46D48Fa570", abi, l1provider);

  // this will used to extract stateRoot and storageValue from compressedProof.
  console.log(7, await verifier.callStatic.verifyZkTrieProof(account, storage, compressedProof));
  // This will be used to check whether the compressedProof is valid under the batch whose hash is `batchHash`.
  console.log(8, await verifier.callStatic.verifyStateCommitment(batchIndex, account, storage, compressedProof));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});