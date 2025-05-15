import { defaultAbiCoder, keccak256, arrayify } from "ethers";
import type { JsonRpcSigner } from "ethers";

export interface SignResult {
  hash: string;
  signature: string;
  value: string;
  userAddress: string;
}

export async function SignTx(
  value: string,
  signer: JsonRpcSigner
): Promise<SignResult> {
  const userAddress = await signer.getAddress();
  const timestamp = Math.floor(Date.now() / 1000).toString();

  // ABI-encode [value, address, timestamp]
  const encoded = defaultAbiCoder.encode(
    ["string", "address", "string"],
    [value, userAddress, timestamp]
  ); // v6: defaultAbiCoder imported directly :contentReference[oaicite:5]{index=5}

  // Keccak256 hash
  const hash = keccak256(encoded);           // v6: keccak256 imported directly :contentReference[oaicite:6]{index=6}

  // Sign the hash
  const signature = await signer.signMessage(arrayify(hash)); // v6: arrayify imported directly :contentReference[oaicite:7]{index=7}

  return { hash, signature, value, userAddress };
}
