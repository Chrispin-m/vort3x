"use client";

import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import "./../styles/Spin.css";
import { SpinEndSignature } from "@/app/url/vortex";
import { useWeb3 } from "../contexts/useWeb3";
import { VortexAddress } from "@/app/config/addresses";
import CountdownLoader from "@/components/CountdownLoader";

interface Prize {
  id: number;
  name: string;
  value: string;
  probability: number;
}

const Spin: React.FC = () => {
  const { getUserAddress, sendToken, checkBalanceForTx } = useWeb3();

  const [prizes, setPrizes] = useState<Prize[]>([
    { id: 1, name: "X1", value: "1.00", probability: 0.0 },
    { id: 3, name: "X0.5", value: "0.50", probability: 0.0 },
    { id: 4, name: "X1000", value: "1000.00", probability: 100.0 },
    { id: 5, name: "X0.2", value: "0.20", probability: 0.0 },
    { id: 8, name: "X0.8", value: "0.80", probability: 0.0 },
    { id: 9, name: "X150", value: "150.00", probability: 0.0 },
    { id: 10, name: "X9", value: "9.00", probability: 0.0 },
  ]);

  const [countdownPrizes, setCountdownPrizes] = useState<Prize[] | null>(null);

  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [selectedBetAmount, setSelectedBetAmount] = useState<number>(0.2);

  const [isWaitingSignature, setIsWaitingSignature] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  const [spinAngle, setSpinAngle] = useState(0);
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
    const prizeIndex = prizeArray.findIndex((prize) => prize.name === winningPrizeName);
    const anglePerSegment = 360 / prizeArray.length;
    const winningSegmentAngle = prizeIndex * (anglePerSegment + 10) + 360;
    const randomTurns = Math.floor(Math.random() * 15) + 20;
    return randomTurns * 360 + (360 - winningSegmentAngle);
  };

  /**
   */
  const onCountdownComplete = (prizesForCountdown: Prize[]) => {
    setShowCountdown(false);

    const winningPrize = prizesForCountdown.find((p) => p.probability === 100);
    if (!winningPrize) {
      console.error("No prize with 100% probability found");
      setIsSpinning(false);
      return;
    }

    const angle = calculateSpinAngle(winningPrize.name, prizesForCountdown);
    setSpinAngle(angle);

    if (wheelRef.current) {
      wheelRef.current.style.transition = "transform 5s ease-out";
      wheelRef.current.style.transform = `rotate(${angle}deg)`;
    }

    setTimeout(() => {
      setPrizeName(winningPrize.name);
      setShowPrizeModal(true);

      setTimeout(() => {
        setShowPrizeModal(false);
        setIsSpinning(false);
      }, 3000);
    }, 10000);
  };

  /**
   * Main handler for “SPIN” button:
   * 1) Check balance, send cUSD → get txHash
   * 2) Call SpinEndSignature(...) → get Prize[]
   * 3) Hide “Signing transaction…”, store prizes in countdownPrizes, then show countdown
   */
  const spinWheel = async (betAmount: string) => {
    // Prevent re-clicking while either:
    //  • We’re waiting for the on-chain signature, or
    //  • The countdown is running, or
    //  • The wheel is currently spinning
    if (isWaitingSignature || showCountdown || isSpinning) return;

    setError(null);
    setIsWaitingSignature(true);

    try {
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

      // Format the Prize[] into “X1”, “X0.5”, etc.
      const formattedPrizes: Prize[] = (response.data as Prize[]).map((prize: Prize) => ({
        ...prize,
        name: `X${parseFloat(prize.value).toString().replace(/\.0+$/, "")}`,
      }));

      setPrizes(formattedPrizes);
      setCountdownPrizes(formattedPrizes);

      setIsWaitingSignature(false);

      setShowCountdown(true);
      setIsSpinning(true);
    } catch (err: any) {
      setError(err?.message || "Transaction failed.");
      setIsWaitingSignature(false);
      setIsSpinning(false);
    }
  };

  return (
    <div className="relative w-full max-w-4xl aspect-square flex flex-col items-center justify-center">
      {/* Three.js starfield background */}
      <div className="canvas-container absolute inset-0 -z-10">
        <canvas ref={canvasRef} className="three-canvas w-full h-full"></canvas>
      </div>

      <h1 className="title text-2xl md:text-3xl font-bold mb-4">Spin to Win</h1>

      <div className="dropdown mb-4">
        <button
          className="button px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors"
          onClick={() =>
            setSelectedBetAmount((prev) => (prev === 3 ? 6 : 3))
          }
          disabled={isWaitingSignature || showCountdown || isSpinning}
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
                  transform: `rotate(${
                    (360 / prizes.length) * index
                  }deg) skewY(-30deg)`,
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
            disabled={isWaitingSignature || showCountdown || isSpinning}
          >
            <div className="pointer"></div>
            SPIN
          </button>
        </div>
      </div>

      {/* “Signing transaction… Please wait”*/}
      {isWaitingSignature && (
        <div className="mt-4 p-2 bg-yellow-300 text-black rounded">
          Signing transaction… Please wait
        </div>
      )}

      <CountdownLoader
        visible={showCountdown}
        duration={10}
        startNumber={100}
        endNumber={90}
        onComplete={() => {
          if (countdownPrizes) {
            onCountdownComplete(countdownPrizes);
          } else {
            // hide countdown if something went wrong
            setShowCountdown(false);
            setIsSpinning(false);
          }
        }}
      />

      {/* Prize Modal */}
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
    </div>
  );
};

export default Spin;
