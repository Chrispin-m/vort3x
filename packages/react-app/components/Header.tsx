// components/Header.tsx
"use client";

import React, { useState, useEffect } from "react";
import { XMarkIcon, Bars3Icon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useWeb3 } from "../contexts/useWeb3";
import {
  getOffchainBalance,
  depositOffchain,
  withdrawOffchain,
} from "../app/url/vortex";
import { formatUnits, parseUnits } from "viem";
import { useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { VortexAddress } from "@/app/config/addresses";


export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [offchainBalance, setOffchainBalance] = useState<string>("0.0");
  const [loadingBalance, setLoadingBalance] = useState(false);
  const { address, getUserAddress, sendToken, checkBalanceForTx } = useWeb3();
  const { connect } = useConnect();

  // Auto-connect to MiniPay when detected
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum?.isMiniPay) {
      connect({ connector: injected() });
    }
  }, [connect]);

  useEffect(() => {
    async function fetchOffchain() {
      setLoadingBalance(true);
      try {
        const user = await getUserAddress();
        const resp = await getOffchainBalance(user);
        const cusd = formatUnits(BigInt(resp.balance), 18);
        setOffchainBalance(cusd);
      } catch {
        setOffchainBalance("0.0");
      } finally {
        setLoadingBalance(false);
      }
    }
    
    if (address) {
      fetchOffchain();
      const id = setInterval(fetchOffchain, 15000);
      return () => clearInterval(id);
    }
  }, [address, getUserAddress]);

  const handleDeposit = async () => {
    const amt = prompt("Enter amount to deposit (CUSD):");
    if (!amt || isNaN(Number(amt)) || Number(amt) <= 0) return;
    
    try {
      const user = await getUserAddress();
      await checkBalanceForTx(user, amt, VortexAddress);
      const hash = await sendToken(VortexAddress, amt);
      await depositOffchain({
        userAddress: user,
        value: parseUnits(amt, 18).toString(),
        hash,
      });
      const resp = await getOffchainBalance(user);
      setOffchainBalance(formatUnits(BigInt(resp.balance), 18));
    } catch (e: any) {
      alert(e.message || "Deposit failed");
    }
  };

  const handleWithdraw = async () => {
    const amt = prompt("Enter amount to withdraw (CUSD):");
    if (!amt || isNaN(Number(amt)) || Number(amt) <= 0) return;
    
    try {
      const user = await getUserAddress();
      await checkBalanceForTx(user, amt, VortexAddress);
      const hash = await sendToken(user, amt);
      await withdrawOffchain({
        userAddress: user,
        value: parseUnits(amt, 18).toString(),
        hash,
      });
      alert("Withdrawal requested");
    } catch (e: any) {
      alert(e.message || "Withdraw failed");
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow">
        <div className="flex items-center justify-between h-16 px-4">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 text-gray-700 hover:text-black"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="text-lg font-semibold">Vort3x</div>
          <div style={{ width: 24 }} />
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-64 bg-white shadow-lg flex flex-col p-4">
            <button
              onClick={() => setIsOpen(false)}
              className="self-end p-2 text-gray-700 hover:text-black"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <div className="mt-4 mb-6 text-center">
              {loadingBalance ? (
                <span>Loading...</span>
              ) : (
                <span className="text-2xl font-bold">{offchainBalance} CUSD</span>
              )}
            </div>
            <nav className="flex-1 space-y-4">
              <Link href="/" onClick={() => setIsOpen(false)}>
                <div className="px-2 py-2 rounded hover:bg-gray-100">Home</div>
              </Link>
              <button
                onClick={handleDeposit}
                className="w-full text-left px-2 py-2 rounded hover:bg-gray-100"
              >
                Deposit
              </button>
              <button
                onClick={handleWithdraw}
                className="w-full text-left px-2 py-2 rounded hover:bg-gray-100"
              >
                Withdraw
              </button>
              <Link href="/help" onClick={() => setIsOpen(false)}>
                <div className="px-2 py-2 rounded hover:bg-gray-100">Help/Support</div>
              </Link>
            </nav>
          </div>
          <div
            className="flex-1 bg-black bg-opacity-30"
            onClick={() => setIsOpen(false)}
          />
        </div>
      )}
    </>
  );
}