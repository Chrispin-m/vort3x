import { Contract, parseEther, Signature } from "ethers";
import type { JsonRpcSigner } from "ethers";
import erc20Abi from "../abi/ERC20.json";
import { cusdContractAddress, VortexAddress } from "./addresses";

export interface SignResult {
  hash: string;         // Transaction hash returned after broadcast
  signature: Signature; // Ethers Signature object (r, s, v)
  value: string;        // The input amount as string
  userAddress: string;  // The signer’s address
}

/**
 * Builds, signs, and broadcasts a CUSD → Vortex transfer of `amount`.
 */
export async function SignTx(
  amount: string,
  signer: JsonRpcSigner
): Promise<SignResult> {
  // 1) Prepare the ERC-20 transfer calldata
  const token = new Contract(cusdContractAddress, erc20Abi, signer);
  const txData = await token.transfer.populateTransaction(
    VortexAddress,
    parseEther(amount)
  );

  // 2) Gather on-chain data via provider
  const provider = signer.provider!;
  const from = await signer.getAddress();
  const nonce = await provider.getTransactionCount(from);
  const { chainId } = await provider.getNetwork();
  const gasLimit = await provider.estimateGas({ ...txData, from });

  const unsignedTx = {
    ...txData,
    from,
    nonce,
    gasLimit,
    chainId
  };

  // 3) Sign & broadcast
  const txResponse = await signer.sendTransaction(unsignedTx);
  await txResponse.wait();

  // 4) txResponse.signature is a Signature object, not a string
  const sig: Signature = txResponse.signature as Signature;

  return {
    hash: txResponse.hash,
    signature: sig,
    value: amount,
    userAddress: from
  };
}