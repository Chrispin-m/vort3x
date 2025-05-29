"use client";

import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import "./../styles/Spin.css";
import axios from "axios";
import { SpinEndPoinSigner,SpinEndPoint,SpinEndSignature } from "@/app/url/vortex";
import type { JsonRpcSigner } from "ethers";
import { useWeb3 } from "../contexts/useWeb3";
import { VortexAddress } from "@/app/config/addresses";
import { parseEther, encodeFunctionData } from "viem";
import StableTokenABI from "@/contexts/cusd-abi.json";
import { celoAlfajores } from "viem/chains";



interface SpinProps {
  userAddress: string;
}


interface Prize {
  id: number;
  name: string;
  value: string;
  probability: number;
}

const Spin = () => {
  const { getUserAddress, sendCUSD, checkBalanceForTx } = useWeb3();
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [selectedBetAmount, setSelectedBetAmount] = useState<number>(1);
  const [prizes, setPrizes] = useState([
    { id: 1, name: "X1", value: "1.00", probability: 0.0 },
    { id: 3, name: "X0.5", value: "0.50", probability: 0.0 },
    { id: 4, name: "X1000", value: "1000.00", probability: 100.0 },
    { id: 5, name: "X0.2", value: "0.20", probability: 0.0 },
    { id: 8, name: "X0.8", value: "0.80", probability: 0.0 },
    { id: 9, name: "X150", value: "150.00", probability: 0.0 },
    { id: 10, name: "X9", value: "9.00", probability: 0.0 },
  ]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [prizeName, setPrizeName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wheelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // const fetchPrizes = async () => {
    //   try {
    //     const response = await axios.get("/api/prizes/");
    //     setPrizes(response.data);
    //   } catch (error) {
    //     console.error("Error fetching prizes, using mock data:", error);
    //     setPrizes(mockPrizes);
    //   }
    // };

    //fetchPrizes();
    initThreeJS();
  }, []);

  const initThreeJS = () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      console.warn("Canvas element not found");
      return;
    }

    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(window.innerWidth, window.innerHeight * 0.9);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / (window.innerHeight * 0.9), 0.1, 1000);
    camera.position.z = 5;

    const particles = new THREE.BufferGeometry();
    const particleCount = 10000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = Math.random() * 20 - 10;
      positions[i * 3 + 1] = Math.random() * 20 - 10;
      positions[i * 3 + 2] = Math.random() * 20 - 10;

      colors[i * 3] = Math.random();
      colors[i * 3 + 1] = Math.random();
      colors[i * 3 + 2] = Math.random();
    }

    particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particles.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    const animate = () => {
      requestAnimationFrame(animate);
      particleSystem.rotation.y += 0.001;
      renderer.render(scene, camera);
    };

    animate();
  };

  const generateSegmentColors = (index: number): string => {
    const colors = ["#FF5733", "#33B5FF", "#FF33EC", "#33FF57", "#FFBD33"];
    return colors[index % colors.length];
  };

  const calculateSpinAngle = (winningPrize: any): number => {
    const prizeIndex = prizes.findIndex((prize) => prize.name === winningPrize);
    const anglePerSegment = 360 / prizes.length;
    const winningSegmentAngle = prizeIndex * (anglePerSegment+10) + 360;
    const randomTurns = Math.floor(Math.random() * 15) + 20;
    return randomTurns * 360 + (360 - winningSegmentAngle);
  };
  // ---- Spin Logic ----
  const spinWheel = async (betAmount: string, recipientAddress: string) => {
    if (isSpinning) return;
    setError(null);
    setIsSpinning(true);

    try {
      const address = await getUserAddress();
      setUserAddress(address);

            // Check if the user has enough cUSD
      await checkBalanceForTx(address, betAmount);

            // Send the cUSD transaction
      const txHash = await sendCUSD(recipientAddress, betAmount);
      console.log(`Transaction successful: ${txHash}`);
      const response = await SpinEndSignature({
        hash:txHash,
        value: betAmount,
        userAddress: address,
      });
      console.log("responses", response.data);

      const winningPrize = prizes.find((prize) => prize.probability === 100);

      if (!response.data) {
        console.error("No prize with 100% probability found");
        setIsSpinning(false);
        return;
      }

      const spinAngle = calculateSpinAngle(`X${response.data.value}`);
      setSpinAngle(spinAngle);

      if (wheelRef.current) {
        wheelRef.current.style.transition = "transform 5s ease-out";
        wheelRef.current.style.transform = `rotate(${spinAngle}deg)`;
      }

      setTimeout(() => {
        setPrizeName(`X${response.data.value}`);
        setShowPrizeModal(true);
        setIsSpinning(false);      
      },10000 );
    } catch (err: any) {
      setError(err?.message || "Transaction failed.");
      setIsSpinning(false);
    }
  };
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Three.js particles */}
    <canvas ref={canvasRef} className="three-canvas absolute inset-0" />

    <h1 className="title">Spin to Win</h1>

      {/* Bet selector */}
    <div className="dropdown">
    <button
    className="button"
    onClick={() =>
    setSelectedBetAmount((prev) => (prev === 3 ? 5 : 3))
  }
  >
  Select Bet Amount: {selectedBetAmount} KES
  </button>
  </div>

      {/* Wheel */}
  <div className="wheel-container">
  <div className="wheel-wrapper">
  <div className="wheel" ref={wheelRef}>
  {prizes.map((prize, idx) => (
    <div
    key={prize.id}
    className="segment"
    style={{
      transform: `rotate(${(360 / prizes.length) * idx}deg) skewY(-30deg)`,
      backgroundColor: generateSegmentColors(idx),
    }}
    >
    <span>{prize.name}</span>
    </div>
    ))}
  </div>

  <button
  className="spin-button"
  onClick={() => spinWheel(selectedBetAmount.toString(), recipientAddress)}
  disabled={isSpinning}
  >
  <div className="pointer"></div>
  {isSpinning ? "Spinning…" : "SPIN"}
  </button>
  </div>
  </div>

      {/* Prize Modal */}
  {showPrizeModal && (
    <div className="modal is-active">
    <div className="modal-content box">
    <h1 className="prize-title">{prizeName}</h1>
    <button
    className="button mt-4"
    onClick={() => setShowPrizeModal(false)}
    >
    Close
    </button>
    </div>
    </div>
    )}

      {/* Error Modal */}
  {error && (
    <div className="modal is-active">
    <div className="modal-content box">
    <h2 className="text-red-600 font-bold">Error</h2>
    <p className="mt-2">{error}</p>
    <button
    className="button mt-4"
    onClick={() => setError(null)}
    >
    Dismiss
    </button>
    </div>
    </div>
    )}
  </div>
  );
};

export default Spin;
