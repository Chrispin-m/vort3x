import { ethers } from "ethers";

export interface SignResult {
  hash: string;
  signature: string;
  value: string;
  userAddress: string;
}

/**
 * Encodes the amount and timestamp, hashes it, and asks the signer to sign.
 */
export async function SignTx(
  value: string,
  signer: ethers.JsonRpcSigner
): Promise<SignResult> {
  const userAddress = await signer.getAddress();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  // encode value + address + timestamp
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ["string", "address", "string"],
    [value, userAddress, timestamp]
  );
  const hash = ethers.utils.keccak256(encoded);
  const signature = await signer.signMessage(ethers.utils.arrayify(hash));
  return { hash, signature, value, userAddress };
}
