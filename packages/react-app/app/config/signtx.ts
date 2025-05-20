import { Contract, parseEther, type JsonRpcSigner, type BigNumberish } from "ethers";
import erc20Abi from "../abi/ERC20.json";
import { cusdContractAddress, VortexAddress } from "./addresses";

export interface SignResult {
  hash: string;
  signature: string;
  value: string;
  userAddress: string;
}

/**
 * Builds, signs, and broadcasts a CUSD → Vortex transfer of `amount` using ethers v6.
 * Logs on-chain data for troubleshooting balance mismatches.
 */
export async function SignTx(
  amount: string,
  signer: JsonRpcSigner
): Promise<SignResult> {
  // Instantiate CUSD contract
  const contract = new Contract(cusdContractAddress, erc20Abi, signer);

  // Compute desired transfer value
  const value: BigNumberish = parseEther(amount);

  // Fetch sender address and network
  const from = await signer.getAddress();
  const provider = signer.provider;
  if (!provider) throw new Error("Signer provider unavailable");
  const network = await provider.getNetwork();

  // DEBUG: log network and contract address
  console.debug(`Network: ${network.name} (${network.chainId}), CUSD addr: ${cusdContractAddress}`);

  // Fetch raw on-chain balance
  const balanceRaw = await contract.balanceOf(from);
  console.debug(`Raw balance: ${balanceRaw.toString()}`);

  // Compare as bigints
  const balance = typeof balanceRaw === 'bigint' ? balanceRaw : BigInt(balanceRaw.toString());
  const desired = typeof value === 'bigint' ? value : BigInt(value.toString());

  if (balance < desired) {
    throw new Error(
      `Insufficient CUSD: have ${balance} wei, need ${desired} wei` +
      ` (i.e. have ${balance / 10n**18n} CUSD, need ${desired / 10n**18n} CUSD)`
    );
  }

  // Prepare tx data
  const txData = await contract.transfer.populateTransaction(VortexAddress, desired);

  // Metadata: nonce & gas
  const nonce = await provider.getTransactionCount(from);
  const gasEstimate = await provider.estimateGas({ ...txData, from });
  const gasLimit = gasEstimate * 11n / 10n;

  const unsignedTx = { ...txData, from, nonce, gasLimit, chainId: network.chainId };

  // Send transaction
  let txResponse;
  try {
    txResponse = await signer.sendTransaction(unsignedTx);
  } catch (err: any) {
    throw new Error(`Transfer failed: ${err.reason ?? err.message}`);
  }

  // Wait for confirmation
  const receipt = await txResponse.wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error(`Transaction reverted in block ${receipt?.blockNumber ?? 'unknown'}`);
  }

  return {
    hash: txResponse.hash,
    signature: txResponse.signature ?? '',
    value: amount,
    userAddress: from
  };
}
