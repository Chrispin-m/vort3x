import axios from "axios";

const BASE = "https://vortex-dapbe.onrender.com/api/stake";

export interface SpinInterface {
  amount: number;
  signedTx: string;
  userAddress: string;
}

export interface SpinWithSigner {
  amount: number;
  signer: unknown; // not used client-side
}

export interface SpinEndSignatureWithHash {
  hash: string;
  value: string;
  userAddress: string;
}

export async function SpinEndPoint({
  signedTx,
  amount,
  userAddress
}: SpinInterface) {
  const resp = await axios.post(
    `${BASE}/Spinsign`,
    { amount, signedTx, userAddress },
    { headers: { "Content-Type": "application/json" } }
  );
  return resp.data;
}

export async function SpinEndPoinSigner({
  amount
}: { amount: number }) {
  const resp = await axios.post(
    `${BASE}/spin`,
    { amount },
    { headers: { "Content-Type": "application/json" } }
  );
  return resp.data;
}

export async function SpinEndSignature({
  hash,
  value,
  userAddress
}: SpinEndSignatureWithHash) {
  const resp = await axios.post(
    `${BASE}/Spinsignwithhash`,
    {
      txHash: hash,
      address: userAddress,
      amount: value
    },
    { headers: { "Content-Type": "application/json" } }
  );
  return resp.data;
}

export async function getOffchainBalance(userAddress: string) {
  const resp = await axios.get(`${BASE}/balance/${userAddress}`);
  return resp.data;
}

export async function depositOffchain({
  userAddress,
  value,
  hash,
}: {
  userAddress: string;
  value: string;
  hash: string;
}) {
  const resp = await axios.post(`${BASE}/deposit`, {
    address: userAddress,
    amount: value,
    tx_hash_input: hash,
  });
  return resp.data;
}

export async function withdrawOffchain({
  userAddress,
  value,
  hash,
}: {
  userAddress: string;
  value: string;
  hash: string;
}) {
  const resp = await axios.post(`${BASE}/withdraw`, {
    address: userAddress,
    amount: value,
    tx_hash_input: hash,
  });
  return resp.data;
}