// adapts a Viem WalletClient into an ethers.js JsonRpcSigner
import { BrowserProvider, JsonRpcSigner } from "ethers";
import type { Account, Chain, Client, Transport } from "viem";
import { useConnectorClient } from "wagmi";
import type { Config } from "wagmi";

export function clientToSigner(client: Client<Transport, Chain, Account>): JsonRpcSigner {
  const { account, chain, transport } = client;
  const provider = new BrowserProvider(transport, {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address
  });
  return new JsonRpcSigner(provider, account.address);
}

export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: client } = useConnectorClient<Config>({ chainId });
  return client ? clientToSigner(client) : undefined;
}
