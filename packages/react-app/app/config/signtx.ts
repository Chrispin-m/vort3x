// app/config/signtx.ts
import { JsonRpcSigner } from "ethers";
import { encodeFunctionData, parseUnits } from "viem";
import { StableTokenABI } from "../abi/StableToken.json";
import { VortexAddress } from "./addresses";

// cUSD contract address on Alfajores
const CUSD_ALFAJORES = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

/**
 * Signs and sends a cUSD ERC20 transfer to the VortexAddress using the provided signer.
 * @param amount - The amount of cUSD to transfer (in human-readable format, e.g., "1").
 * @param signer - The Ethers.js JsonRpcSigner from the connected wallet.
 * @returns An object containing the transaction hash, value, and user address.
 */
export async function SignTx(
  amount: string,
  signer: JsonRpcSigner
): Promise<{ hash: string; value: string; userAddress: string }> {
  try {
    const receiver = VortexAddress;
    const decimals = 18;
    const valueUnits = parseUnits(amount, decimals);

    // Encode the ERC20 transfer function data
    const data = encodeFunctionData({
      abi: StableTokenABI,
      functionName: "transfer",
      args: [receiver, valueUnits],
    });

    // Prepare the transaction
    const tx = {
      to: CUSD_ALFAJORES,
      data,
    };

    // Estimate gas (optional, improves reliability)
    const gasLimit = await signer.estimateGas(tx);

    // Send the transaction using the signer
    const signedTx = await signer.sendTransaction({
      ...tx,
      gasLimit,
    });

    // Wait for the transaction to be mined
    const receipt = await signedTx.wait();

    // Get the user's address from the signer
    const userAddress = await signer.getAddress();

    return {
      hash: receipt.hash,
      value: amount,
      userAddress,
    };
  } catch (error) {
    console.error("Transaction failed:", error);
    throw new Error("Failed to sign and send transaction");
  }
}