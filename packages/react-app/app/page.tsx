"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useWeb3 } from "../contexts/useWeb3";

const Spin = dynamic(() => import("../components/Spin"), { ssr: false });

export default function Home() {
    const { address, isConnecting, connectWallet } = useWeb3();
    
    return (
        <>
            {!address ? (
                <div className="flex items-center justify-center h-full">
                    <button
                        onClick={connectWallet}
                        className="px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
                        disabled={isConnecting}
                    >
                        {isConnecting ? "Connecting..." : "Connect Wallet"}
                    </button>
                </div>
            ) : (
                <Spin />
            )}
        </>
    );
}