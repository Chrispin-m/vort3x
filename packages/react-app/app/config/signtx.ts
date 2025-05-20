import { Contract, parseEther, formatEther, type JsonRpcSigner, type BigNumberish, type Signature } from "ethers";
import erc20Abi from "../abi/ERC20.json";
import { cusdContractAddress, VortexAddress } from "./addresses";

export interface SignResult {
  hash: string;         // Transaction hash
  signature: Signature; // Ethers Signature object (r, s, v)
  value: string;        // The input amount as string
  userAddress: string;  // The signer’s address
}

/**
 * Builds, signs, and broadcasts a CUSD → Vortex transfer of `amount` using ethers v6.
 */
export async function SignTx(
  amount: string,
  signer: JsonRpcSigner
): Promise<SignResult> {
  // 1) Instantiate CUSD contract
  const contract = new Contract(cusdContractAddress, erc20Abi, signer);

  // 2) Normalize transfer amount and verify balance
  const value: BigNumberish = parseEther(amount);
  const from = await signer.getAddress();
  const balanceRaw = await contract.balanceOf(from);
  const balance = typeof balanceRaw === 'bigint' ? balanceRaw : BigInt(balanceRaw.toString());
  if (balance < (value as bigint)) {
    throw new Error(
      `Insufficient CUSD: have ${formatEther(balance)}, need ${amount}`
    );
  }

  // 3) Prepare transaction payload
  const txData = await contract.transfer.populateTransaction(
    VortexAddress,
    value
  );

  // 4) Add metadata
  const provider = signer.provider;
  if (!provider) throw new Error("Signer provider unavailable");
  const fromAddress = from;
  const nonce = await provider.getTransactionCount(fromAddress);
  const network = await provider.getNetwork();

  const gasEstimate = await provider.estimateGas({
    ...txData,
    from: fromAddress
  });
  const gasLimit = gasEstimate * 11n / 10n; // +10%

  const unsignedTx = {
    ...txData,
    from: fromAddress,
    nonce,
    gasLimit,
    chainId: network.chainId
  };

  // 5) Sign & send
  let txResponse;
  try {
    txResponse = await signer.sendTransaction(unsignedTx);
  } catch (err: any) {
    const reason = err?.reason ?? err?.message;
    throw new Error(`Transfer failed: ${reason}`);
  }

  // 6) Await confirmation
  const receipt = await txResponse.wait();
  if (!receipt || receipt.status !== 1) {
    const block = receipt?.blockNumber ?? "unknown";
    throw new Error(`Transaction reverted in block ${block}`);
  }

  // 7) Return results
  return {
    hash: txResponse.hash,
    signature: txResponse.signature as Signature,
    value: amount,
    userAddress: fromAddress
  };
}
