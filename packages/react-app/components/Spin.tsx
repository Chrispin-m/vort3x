"use client";

import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import "./../styles/Spin.css";
import { SpinEndSignature } from "@/app/url/vortex";
import { useWeb3 } from "../contexts/useWeb3";
import { VortexAddress } from "@/app/config/addresses";

interface Prize {
  id: number;
  name: string;
  value: string;
  probability: number;
}

const Spin = () => {
  const { getUserAddress, sendToken, checkBalanceForTx } = useWeb3();
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [selectedBetAmount, setSelectedBetAmount] = useState<number>(0.2);
  const [prizes, setPrizes] = useState<Prize[]>([
    { id: 1, name: "X1", value: "1.00", probability: 0.0 },
    { id: 3, name: "X0.5", value: "0.50", probability: 0.0 },
    { id: 4, name: "X1000", value: "1000.00", probability: 100.0 },
    { id: 5, name: "X0.2", value: "0.20", probability: 0.0 },
    { id: 8, name: "X0.8", value: "0.80", probability: 0.0 },
    { id: 9, name: "X150", value: "150.00", probability: 0.0 },
    { id: 10, name: "X9", value: "9.00", probability: 0.0 },
  ]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinProgress, setSpinProgress] = useState(0);
  const [spinAngle, setSpinAngle] = useState(0);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [prizeName, setPrizeName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wheelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize Three.js background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight * 0.9);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / (window.innerHeight * 0.9),
      0.1,
      1000
    );
    camera.position.z = 5;

    const particles = new THREE.BufferGeometry();
    const particleCount = 8000;
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
      size: 0.08,
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
  }, []);

  // spin progress bar
  useEffect(() => {
    if (!isSpinning) {
      setSpinProgress(0);
      return;
    }
    setSpinProgress(0);
    const start = Date.now();
    const duration = 10000; // 10 seconds
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const percent = Math.min((elapsed / duration) * 100, 100);
      setSpinProgress(percent);
      if (percent >= 100) {
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isSpinning]);

  const generateSegmentColors = (index: number): string => {
    const colors = ["#FF5733", "#33B5FF", "#FF33EC", "#33FF57", "#FFBD33"];
    return colors[index % colors.length];
  };

  const calculateSpinAngle = (winningPrizeName: string, prizeArray: Prize[]): number => {
    const prizeIndex = prizeArray.findIndex((prize) => prize.name === winningPrizeName);
    const anglePerSegment = 360 / prizeArray.length;
    const winningSegmentAngle = prizeIndex * (anglePerSegment + 10) + 360;
    const randomTurns = Math.floor(Math.random() * 15) + 20;
    return randomTurns * 360 + (360 - winningSegmentAngle);
  };

  const spinWheel = async (betAmount: string) => {
    if (isSpinning) return;
    setError(null);
    setIsSpinning(true);

    try {
      const address = await getUserAddress();
      setUserAddress(address);

      // Check if the user has enough cUSD
      await checkBalanceForTx(address, betAmount, VortexAddress);

      // Send the cUSD transaction
      const txHash = await sendToken(VortexAddress, betAmount);

      const response = await SpinEndSignature({
        hash: txHash,
        value: betAmount,
        userAddress: address,
      });

      const formattedPrizes = (response.data as Prize[]).map((prize: Prize) => ({
        ...prize,
        name: `X${parseFloat(prize.value).toString().replace(/\.0+$/, "")}`,
      }));
      setPrizes(formattedPrizes);

      const allPrizes: Prize[] = response.data as Prize[];
      const winningPrize = allPrizes.find((p) => p.probability === 100);

      if (!winningPrize) {
        throw new Error("No prize with 100% probability found");
      }

      const angle = calculateSpinAngle(`X${winningPrize.value}`, formattedPrizes);
      setSpinAngle(angle);

      if (wheelRef.current) {
        wheelRef.current.style.transition = "transform 5s ease-out";
        wheelRef.current.style.transform = `rotate(${angle}deg)`;
      }

      // After spin completes, show prize modal
      setTimeout(() => {
        setPrizeName(`X${winningPrize.value}`);
        setShowPrizeModal(true);
        setIsSpinning(false);

        // Hide the modal after 3 seconds
        setTimeout(() => {
          setShowPrizeModal(false);
        }, 3000);
      }, 10000);
    } catch (err: any) {
      setError(err?.message || "Transaction failed.");
      setIsSpinning(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900">
      {/* Three.js Background Canvas */}
      <div className="canvas-container absolute top-0 left-0 w-full h-full -z-10">
        <canvas ref={canvasRef} className="three-canvas" />
      </div>

      {/* Title */}
      <h1 className="text-4xl text-center text-white font-bold mt-8">Spin to Win</h1>

      {/* Bet Amount Selector */}
      <div className="flex justify-center mt-6">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
          onClick={() => setSelectedBetAmount((prev) => (prev === 0.2 ? 0.5 : 0.2))}
        >
          Bet Amount: {selectedBetAmount} cUSD
        </button>
      </div>

      {/* Wheel Container */}
      <div className="wheel-container flex justify-center items-center mt-8 relative">
        {/* Overlay during spin */}
        {isSpinning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-60 z-10">
            <div className="mb-4 text-white text-2xl animate-pulse">Spinning...</div>
            <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-400 transition-all"
                style={{ width: `${spinProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Wheel */}
        <div className="wheel-wrapper relative">
          <div className="wheel" ref={wheelRef}>
            {prizes.map((prize, index) => (
              <div
                key={prize.id}
                className="segment flex items-center justify-center text-white font-semibold"
                style={{
                  transform: `rotate(${(360 / prizes.length) * index}deg) skewY(-30deg)`,
                  backgroundColor: generateSegmentColors(index),
                }}
              >
                <span className="rotate-30">{prize.name}</span>
              </div>
            ))}
          </div>

          {/* Pointer */}
          <div className="absolute top-[-10px] left-1/2 transform -translate-x-1/2">
            <div className="w-0 h-0 border-l-8 border-r-8 border-b-16 border-b-red-600"></div>
          </div>
        </div>
      </div>

      {/* Spin Button */}
      <div className="flex justify-center mt-6">
        <button
          className={`px-6 py-3 rounded-full text-white font-bold transition ${
            isSpinning
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          }`}
          onClick={() => spinWheel(selectedBetAmount.toString())}
          disabled={isSpinning}
        >
          {isSpinning ? "Good Luck!" : "SPIN"}
        </button>
      </div>

      {/* Prize Modal */}
      {showPrizeModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-20">
          <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
            <h2 className="text-3xl font-extrabold text-yellow-500 mb-4">
              {prizeName}
            </h2>
            <p className="text-lg">Congratulations! You’ve won {prizeName}!</p>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {error && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-20">
          <div className="bg-red-100 rounded-lg p-6 shadow-lg text-red-700">
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p>{error}</p>
            <button
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
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
