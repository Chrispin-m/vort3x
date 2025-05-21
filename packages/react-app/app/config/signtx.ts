import { 
  createPublicClient, 
  createWalletClient, 
  custom, 
  http, 
  getContract, 
  encodeFunctionData, 
  parseUnits, 
  formatUnits,
  type Address
} from 'viem';
import { celoAlfajores } from 'viem/chains';
import { stableTokenABI } from '@celo/abis';

const CUSD_ALFAJORES = '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1';

const publicClient = createPublicClient({
  chain: celoAlfajores,
  transport: http(),
});

export async function SignTx(
  amount: string,
  receiver: Address
): Promise<{ hash: `0x${string}`; value: string; userAddress: Address }> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No injected wallet found');
  }

  const walletClient = createWalletClient({
    chain: celoAlfajores,
    transport: custom(window.ethereum),
  });

  const [from] = await walletClient.getAddresses();
  if (!from) throw new Error('No connected account');

  const valueUnits = parseUnits(amount, 18);

  const { request } = await publicClient.simulateContract({
    address: CUSD_ALFAJORES,
    abi: stableTokenABI,
    functionName: 'transfer',
    args: [receiver, valueUnits],
    account: from,
  });

  const hash = await walletClient.writeContract(request);
  
  return { 
    hash, 
    value: amount,
    userAddress: from 
  };
}

export async function getCusdBalance(address: Address): Promise<string> {
  const token = getContract({
    abi: stableTokenABI,
    address: CUSD_ALFAJORES,
    client: publicClient,
  });
  
  const balance = await token.read.balanceOf([address]);
  return formatUnits(balance, 18);
}