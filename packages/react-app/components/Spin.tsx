"use client";

import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import "./../styles/Spin.css";
import { SignTx, SignResult } from "@/app/config/signtx";
import type { JsonRpcSigner } from "ethers";

interface SpinProps {
  signer: JsonRpcSigner;
  userAddress: string;
}

interface Prize {
  id: number;
  name: string;
  value: string;
  probability: number;
}

const Spin = ({ signer }: SpinProps) => {
  // ---- State ----
  const [selectedBetAmount, setSelectedBetAmount] = useState<number>(3);
  const [prizes] = useState<Prize[]>([
    { id: 1, name: "X1", value: "1.00", probability: 0.0 },
    { id: 2, name: "X0.5", value: "0.50", probability: 0.0 },
    { id: 3, name: "X1000", value: "1000.00", probability: 100.0 },
    { id: 4, name: "X0.2", value: "0.20", probability: 0.0 },
    { id: 5, name: "X0.8", value: "0.80", probability: 0.0 },
    { id: 6, name: "X150", value: "150.00", probability: 0.0 },
    { id: 7, name: "X9", value: "9.00", probability: 0.0 },
  ]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [prizeName, setPrizeName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ---- Refs ----
  const wheelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ---- Three.js Background ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight * 0.9);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / (window.innerHeight * 0.9),
      0.1,
      1000
    );
    camera.position.z = 5;

    const particleCount = 5000;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions.set(
        [
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
        ],
        i * 3
      );
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ size: 0.05, color: 0xffffff });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const animate = () => {
      points.rotation.y += 0.001;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  // ---- Helpers ----
  const generateSegmentColors = (index: number) => {
    const colors = ["#FF5733", "#33B5FF", "#FF33EC", "#33FF57", "#FFBD33"];
    return colors[index % colors.length];
  };

  const calculateSpinAngle = (winningIndex: number) => {
    const baseAngle = (360 / prizes.length) * winningIndex;
    const randomRounds = 5 + Math.floor(Math.random() * 5);
    return randomRounds * 360 + (360 - baseAngle - 360 / (prizes.length * 2));
  };

  // ---- Spin Logic ----
  const spinWheel = async () => {
    if (isSpinning) return;
    setError(null);
    setIsSpinning(true);

    try {
      // 1) Create a tokenUri tying in the local bet amount
      const tokenUri = `kes-${selectedBetAmount}-${Date.now()}`;

      // 2) Mint the NFT via SignTx
      const result: SignResult = await SignTx(tokenUri, signer);

      // 3) Determine winning prize (we use your 100% probability slot)
      const winIndex = prizes.findIndex((p) => p.probability === 100);
      const angle = calculateSpinAngle(winIndex);

      // 4) Spin the wheel
      if (wheelRef.current) {
        wheelRef.current.style.transition = "transform 3s ease-out";
        wheelRef.current.style.transform = `rotate(${angle}deg)`;
      }

      // 5) Show prize modal when done
      setTimeout(() => {
        setPrizeName(prizes[winIndex].name);
        setShowPrizeModal(true);
        setIsSpinning(false);
      }, 3000);
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
            onClick={spinWheel}
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
