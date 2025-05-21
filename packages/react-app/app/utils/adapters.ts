import { BrowserProvider, JsonRpcSigner } from "ethers";
import { useAccount, useConnectorClient } from "wagmi";
import type { Client, Transport, Chain, Account } from "viem";

export function clientToSigner(client: Client<Transport, Chain, Account>): JsonRpcSigner {
  const { account, chain, transport } = client;
  const provider = new BrowserProvider(transport, {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  });
  return new JsonRpcSigner(provider, account.address);
}

export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: client } = useConnectorClient({ chainId });
  const { address } = useAccount();
  
  if (!client || !address) return undefined;
  
  return {
    signer: clientToSigner(client),
    address: address as `0x${string}`
  };
}