import axios from "axios";

const BASE = "https://vortex-bd.vercel.app/api/stake";

export interface SpinRequest {
  amount: string;
  userAddress: string;
  txHash: string;
}

// 1) Initiate a spin to get the spin contract address or challenge message
export async function initiateSpin(amount: string) {
  const resp = await axios.post(
    `${BASE}/spin`,
    { amount },
    { headers: { "Content-Type": "application/json" } }
  );
  // expects { spinContractAddress: string }
  return resp.data as { spinContractAddress: string };
}

// 2) Finalize spin by sending txHash and userAddress
export async function finalizeSpin({ txHash, userAddress, amount }: SpinRequest) {
  const resp = await axios.post(
    `${BASE}/spin/complete`,
    { txHash, userAddress, amount },
    { headers: { "Content-Type": "application/json" } }
  );
  // expects { prize: string; value: string }
  return resp.data;
}