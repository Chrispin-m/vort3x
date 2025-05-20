import { Contract, parseEther, Signature, ContractTransactionResponse } from "ethers";
import type { JsonRpcSigner } from "ethers";
import erc20Abi from "../abi/ERC20.json";
import { cusdContractAddress, VortexAddress } from "./addresses";

export interface SignResult {
  hash: string;
  signature: Signature;
  value: string;
  userAddress: string;
}

export async function SignTx(
  amount: string,
  signer: JsonRpcSigner
): Promise<SignResult> {
  const token = new Contract(cusdContractAddress, erc20Abi, signer);
  const provider = signer.provider!;
  const from = await signer.getAddress();
  
  // Convert input amount to wei
  const amountWei = parseEther(amount);

  // Check cUSD balance
  const balanceWei = await token.balanceOf(from);
  if (balanceWei < amountWei) {
    throw new Error(`Insufficient cUSD balance. Needed: ${amount} cUSD, Available: ${balanceWei.toString() / 1e18} cUSD`);
  }

  // Validate contract addresses
  if (!cusdContractAddress || !VortexAddress) {
    throw new Error("Invalid contract addresses");
  }

  // Prepare transaction data
  const txData = await token.transfer.populateTransaction(
    VortexAddress,
    amountWei
  );

  // Get chain parameters
  const [nonce, { chainId }, gasLimit] = await Promise.all([
    provider.getTransactionCount(from),
    provider.getNetwork(),
    provider.estimateGas({ ...txData, from })
  ]);

  // Build transaction
  const unsignedTx = {
    ...txData,
    from,
    nonce,
    gasLimit,
    chainId
  };

  // Send transaction
  let txResponse: ContractTransactionResponse;
  try {
    txResponse = await signer.sendTransaction(unsignedTx);
    await txResponse.wait();
  } catch (error) {
    throw new Error(`Transaction failed: ${error instanceof Error ? error.message : error}`);
  }

  return {
    hash: txResponse.hash,
    signature: txResponse.signature as Signature,
    value: amount,
    userAddress: from
  };
}