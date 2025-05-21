// Rewritten to use ethers.js JsonRpcSigner for signing spin requests
import { BigNumber, ethers } from "ethers";
import type { JsonRpcSigner } from "ethers";
import { cusdContractAddress } from "./addresses";
import StableTokenABI from "../abi/StableToken.abi.json";

// Sign and send a cUSD transfer of `amount` (string decimal) from the connected signer to the spin contract
export async function SignTx(
  amount: string,
  signer: JsonRpcSigner,
  spinContractAddress: string
): Promise<{ hash: string; userAddress: string }> {
  // Get user's address
  const userAddress = await signer.getAddress();
  // Parse amount to 18-decimals
  const value = ethers.utils.parseUnits(amount, 18);

  // Create contract instance
  const tokenContract = new ethers.Contract(
    cusdContractAddress,
    StableTokenABI,
    signer
  );

  // Approve the spin contract to spend on user's behalf if needed
  const allowance: BigNumber = await tokenContract.allowance(userAddress, spinContractAddress);
  if (allowance.lt(value)) {
    const approveTx = await tokenContract.approve(spinContractAddress, value);
    await approveTx.wait();
  }

  // Send the spin request via the spin contract's entrypoint
  const spinContract = new ethers.Contract(
    spinContractAddress,
    [
      "function spin(uint256 amount) returns (bytes32)"
    ],
    signer
  );
  const tx = await spinContract.spin(value);
  const receipt = await tx.wait();

  return { hash: receipt.transactionHash, userAddress };
}