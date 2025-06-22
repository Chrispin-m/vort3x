import axios from "axios";

const BASE_URL = "https://vortex-dapbe.onrender.com/api/stake";
const OFFCHAIN_URL = "https://vortex-dapbe.onrender.com/api/offchain";

export interface SpinTransaction {
  amount: number;
  signedTx: string;
  userAddress: string;
}

export interface SpinWithSigner {
  amount: number;
  signer: unknown;
}

export interface SignedSpinRequest {
  hash: string;
  value: string;
  userAddress: string;
}

export interface DepositRequest {
  userAddress: string;
  value: string;
  hash: string;
}

export interface WithdrawalRequest {
  userAddress: string;
  value: string;
}


export interface SpinOffChainRequest {
  address: string;
  amount: number;
  token_symbol: string; 
}


export async function spinEndpoint(transaction: SpinTransaction) {
  const { data } = await axios.post(
    `${BASE_URL}/Spinsign`,
    {
      amount: transaction.amount,
      signedTx: transaction.signedTx,
      userAddress: transaction.userAddress
    },
    { headers: { "Content-Type": "application/json" } }
  );
  return data;
}


export async function spinEndpointSigner(request: { amount: number }) {
  const { data } = await axios.post(
    `${BASE_URL}/spin`,
    { amount: request.amount },
    { headers: { "Content-Type": "application/json" } }
  );
  return data;
}


export async function spinEndSignature(request: SignedSpinRequest) {
  const { data } = await axios.post(
    `${BASE_URL}/Spinsignwithhash`,
    {
      txHash: request.hash,
      address: request.userAddress,
      amount: request.value
    },
    { headers: { "Content-Type": "application/json" } }
  );
  return data;
}

export async function getOffchainBalance(userAddress: string) {
  const { data } = await axios.get(
    `${OFFCHAIN_URL}/balance/${encodeURIComponent(userAddress)}`
  );
  return data;
}


export async function depositOffchain(request: DepositRequest) {
  const { data } = await axios.post(`${OFFCHAIN_URL}/deposit`, {
    address: request.userAddress,
    amount: request.value,
    tx_hash_input: request.hash
  });
  return data;
}


export async function withdrawOffchain(request: WithdrawalRequest) {
  const { data } = await axios.post(`${OFFCHAIN_URL}/withdraw`, {
    address: request.userAddress,
    amount: request.value,
  });
  return data;
}

export async function spinoffchain(request: SpinOffChainRequest) {
  const { data } = await axios.post(
    `${OFFCHAIN_URL}/spin-offchain`,
    {
      address: request.address,
      betAmount: request.amount,
      token_symbol: request.token_symbol,
    },
    { headers: { "Content-Type": "application/json" } }
  );
  return data;
}
