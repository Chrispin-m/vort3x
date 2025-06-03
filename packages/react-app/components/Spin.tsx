"use client";

import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import "./../styles/Spin.css";
import CountdownLoader from "./CountdownLoader";
import { SpinEndSignature } from "@/app/url/vortex";
import { useWeb3 } from "../contexts/useWeb3";
import { VortexAddress } from "@/app/config/addresses";

interface Prize {
  id: number;
  name: string;
  value: string;
  probability: number;
}

const Spin: React.FC = () => {
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
  const [pendingAngle, setPendingAngle] = useState<number | null>(null);
  const [showLoader, setShowLoader] = useState(false);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [prizeName, setPrizeName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wheelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    initThreeJS();
  }, []);

  const initThreeJS = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas });
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

  const calculateSpinAngle = (winningPrizeName: string, prizeArray: Prize[]): number => {
    const prizeIndex = prizeArray.findIndex((p) => p.name === winningPrizeName);
    const anglePerSegment = 360 / prizeArray.length;
    const winningSegmentAngle = prizeIndex * (anglePerSegment + 10) + 360;
    const randomTurns = Math.floor(Math.random() * 15) + 20;
    return randomTurns * 360 + (360 - winningSegmentAngle);
  };

  const onLoaderComplete = () => {
    setShowLoader(false);

    if (pendingAngle !== null && wheelRef.current) {
      wheelRef.current.style.transition = "transform 5s ease-out";
      wheelRef.current.style.transform = `rotate(${pendingAngle}deg)`;

      setTimeout(() => {
        setShowPrizeModal(true);
        setIsSpinning(false);

        setTimeout(() => {
          setShowPrizeModal(false);
        }, 3000);
      }, 5000);
    } else {
      setIsSpinning(false);
      setError("Unable to spin wheel. Please try again.");
    }
  };

  const spinWheel = async (betAmount: string) => {
    if (isSpinning) return;
    setError(null);
    setIsSpinning(true);

    try {
      // 1) Get user address & check balance
      const address = await getUserAddress();
      setUserAddress(address);
      await checkBalanceForTx(address, betAmount, VortexAddress);

      const txHash = await sendToken(VortexAddress, betAmount);
      console.log(`Transaction successful: ${txHash}`);

      const response = await SpinEndSignature({
        hash: txHash,
        value: betAmount,
        userAddress: address,
      });

      const formattedPrizes: Prize[] = (response.data as Prize[]).map((prize) => ({
        ...prize,
        name: `X${parseFloat(prize.value).toString().replace(/\.0+$/, "")}`,
      }));
      setPrizes(formattedPrizes);

      const winningPrize = (response.data as Prize[]).find((p) => p.probability === 100);
      if (!winningPrize) {
        setError("No guaranteed prize found.");
        setIsSpinning(false);
        return;
      }

      const angle = calculateSpinAngle(`X${winningPrize.value}`, formattedPrizes);
      setPendingAngle(angle);
      setPrizeName(`X${winningPrize.value}`);

      setShowLoader(true);
    } catch (err: any) {
      setError(err?.message || "Transaction failed.");
      setIsSpinning(false);
    }
  };

  return (
    <div className="relative w-full max-w-4xl aspect-square flex flex-col items-center justify-center">
      {/* BACKGROUND PARTICLES */}
      <div className="canvas-container absolute inset-0 -z-10">
        <canvas ref={canvasRef} className="three-canvas w-full h-full"></canvas>
      </div>

      <h1 className="title text-2xl md:text-3xl font-bold mb-4">Spin to Win</h1>

      <div className="dropdown mb-4">
        <button
          className="button px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors"
          onClick={() => setSelectedBetAmount((prev) => (prev === 3 ? 6 : 3))}
          disabled={isSpinning}
        >
          Select Bet Amount: {selectedBetAmount}
        </button>
      </div>

      <div className="wheel-container w-full max-w-md">
        <div className="wheel-wrapper">
          <div className="wheel" ref={wheelRef}>
            {prizes.map((prize, index) => (
              <div
                key={prize.id}
                className="segment"
                style={{
                  transform: `rotate(${(360 / prizes.length) * index}deg) skewY(-30deg)`,
                  backgroundColor: generateSegmentColors(index),
                }}
              >
                <span>{prize.name}</span>
              </div>
            ))}
          </div>

          <button
            className="spin-button"
            onClick={() => spinWheel(selectedBetAmount.toString())}
            disabled={isSpinning}
          >
            <div className="pointer"></div>
            SPIN
          </button>
        </div>
      </div>

      {showPrizeModal && (
        <div
          className="modal is-active"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 9999,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            className="modal-content"
            style={{
              width: "clamp(50%, 70%, 80%)",
              maxWidth: "800px",
            }}
          >
            <div
              className="box"
              style={{
                textAlign: "center",
                padding: "2rem",
                borderRadius: "10px",
              }}
            >
              <h1
                className="prize-title"
                style={{
                  color: "gold",
                  fontSize: "clamp(2rem, 5vw, 4rem)",
                  fontWeight: "bold",
                }}
              >
                {prizeName}
              </h1>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {error && (
        <div className="modal is-active">
          <div className="modal-content box">
            <h2 className="text-red-600 font-bold">Error</h2>
            <p className="mt-2">{error}</p>
            <button className="button mt-4" onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      <CountdownLoader
        visible={showLoader}
        duration={10}
        onComplete={onLoaderComplete}
      />
    </div>
  );
};

export default Spin;
