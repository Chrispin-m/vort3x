import { AbiCoder, keccak256, toBeArray } from "ethers";
import ERC20_ABI from "../abi/ERC20.json";

export async function SignTx(
  value: string,
  signer: JsonRpcSigner
): Promise<SignResult> {
  const erc20Interface = new Interface(ERC20_ABI);
  const userAddress = await signer.getAddress();
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const abiCoder = new AbiCoder();
  const encoded = abiCoder.encode(
    ["string", "address", "string"],
    [value, userAddress, timestamp]
  );

  const hash = keccak256(encoded);
  const signature = await signer.signMessage(toBeArray(hash));

  return { hash, signature, value, userAddress };
}