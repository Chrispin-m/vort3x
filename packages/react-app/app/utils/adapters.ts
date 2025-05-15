import { Signer } from "ethers";
import type { WalletClient } from "viem";

export function WalletClientToSigner(walletClient: WalletClient): Signer {
  return {
    getAddress: async () => (await walletClient.getAddresses())[0],
    signMessage: async (message: string | Uint8Array) => {
      if (typeof message === "string") {
        message = new TextEncoder().encode(message);
      }
      return walletClient.signMessage({ message: { raw: message } });
    },
  } as Signer;
}