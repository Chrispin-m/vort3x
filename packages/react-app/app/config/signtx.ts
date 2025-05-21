import { createPublicClient, createWalletClient, custom, parseEther } from "viem";
import { celoAlfajores } from "viem/chains";
import stableTokenABI from "@celo/abis/lib/StableToken.json";
import type { JsonRpcSigner } from "ethers";

export interface SignResult {
  hash: string;
  signature: string;
  value: string;
  userAddress: string;
}

/**
 * Builds, signs, and broadcasts a cUSD → Vortex transfer of `amount` using MiniPay.
 * Compatible with ethers JsonRpcSigner from Spin component.
 */
export async function SignTx(
  amount: string,
  signer: JsonRpcSigner
): Promise<SignResult> {
  // Ensure we have the injected provider
  const ethereum = (signer.provider as any)?._provider || (window as any).ethereum;
  if (!ethereum) {
    throw new Error("No injected MiniPay wallet found");
  }

  // Initialize viem clients
  const walletClient = createWalletClient({
    chain: celoAlfajores,
    transport: custom(ethereum),
  });
  const publicClient = createPublicClient({
    chain: celoAlfajores,
    transport: http(),
  });

  // Request account if needed
  const [userAddress] = await walletClient.getAddresses();

  // Prepare transfer
  const amountInWei = parseEther(amount);
  const hash = await walletClient.writeContract({
    address: cusdContractAddress,
    abi: stableTokenABI,
    functionName: "transfer",
    account: userAddress,
    args: [VortexAddress, amountInWei],
  });

  // Wait for confirmation
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error(`Transaction failed: ${receipt.status}`);
  }

  // MiniPay does not return signature; sign a message instead for proof
  const signature = await walletClient.signMessage({
    account: userAddress,
    message: `Transfer ${amount} cUSD to Vortex: ${hash}`,
  });

  return { hash, signature, value: amount, userAddress };
}
