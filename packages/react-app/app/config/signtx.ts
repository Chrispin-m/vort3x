import { defaultAbiCoder, keccak256, arrayify } from "ethers";
import type { JsonRpcSigner } from "ethers";

export interface SignResult {
  hash: string;
  signature: string;
  value: string;
  userAddress: string;
}

/**
 * Encodes the spin value, user address, and timestamp,
 * hashes the payload, and asks the signer to sign.
 */
export async function SignTx(
  value: string,
  signer: JsonRpcSigner
): Promise<SignResult> {
  const userAddress = await signer.getAddress();
  const timestamp = Math.floor(Date.now() / 1000).toString();

  // Abi-encode [value, address, timestamp]
  const encoded = defaultAbiCoder.encode(
    ["string", "address", "string"],
    [value, userAddress, timestamp]
  );                                                    

  // Hash it
  const hash = keccak256(encoded);                           

  // Sign the binary hash
  const signature = await signer.signMessage(arrayify(hash));

  return { hash, signature, value, userAddress };
}
