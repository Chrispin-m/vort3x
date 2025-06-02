{"use client";

import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import "./../styles/Spin.css";
import axios from "axios";
import { SpinEndPoinSigner, SpinEndPoint, SpinEndSignature } from "@/app/url/vortex";
import type { JsonRpcSigner } from "ethers";
import { useWeb3 } from "../contexts/useWeb3";
import { VortexAddress } from "@/app/config/addresses";
import { parseEther, encodeFunctionData } from "viem";
import StableTokenABI from "@/contexts/cusd-abi.json";
import { celoAlfajores } from "viem/chains";

interface Prize {
  id: number;
  name: string;
  value: string;
  probability: number;
}

const SPIN_DURATION = 5; // seconds
const COUNTDOWN_DURATION = 3; // seconds
const TIPS = [
  "Big wins coming your way!",
  "Feeling lucky today?",
  "Fortune favors the bold!",
  "Get ready to win big!",
  "The wheel is spinning your fortune!",
  "Good luck is just a spin away!",
  "Jackpot energy incoming!",
];

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
  const [spinAngle, setSpinAngle] = useState(0);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [prizeName, setPrizeName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [currentTip, setCurrentTip] = useState<string>("");
  const [particleSpeed, setParticleSpeed] = useState<number>(0.001);

  const wheelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleSystemRef = useRef<THREE.Points | null>(null);
  const animationRef = useRef<number>(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const tipIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initThreeJS();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearIntervals();
    };
  }, []);

  useEffect(() => {
    if (isSpinning) {
      // Speed up particles during spin
      setParticleSpeed(0.05);
      
      // Start countdown
      let remaining = COUNTDOWN_DURATION;
      setCountdown(remaining);
      
      countdownRef.current = setInterval(() => {
        remaining -= 1;
        setCountdown(remaining);
        
        if (remaining <= 0) {
          clearInterval(countdownRef.current as NodeJS.Timeout);
          countdownRef.current = null;
        }
      }, 1000);
      
      // Rotate tips
      setCurrentTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
      tipIntervalRef.current = setInterval(() => {
        setCurrentTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
      }, 2000);
    } else {
      // Slow down particles after spin
      setParticleSpeed(0.001);
      clearIntervals();
    }
  }, [isSpinning]);

  const clearIntervals = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (tipIntervalRef.current) {
      clearInterval(tipIntervalRef.current);
      tipIntervalRef.current = null;
    }
  };

  const initThreeJS = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn("Canvas element not found");
      return;
    }

    const renderer = new THREE.WebGLRenderer({ 
      canvas,
      alpha: true,
      antialias: true 
    });
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
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = Math.random() * 20 - 10;
      positions[i * 3 + 1] = Math.random() * 20 - 10;
      positions[i * 3 + 2] = Math.random() * 20 - 10;

      colors[i * 3] = Math.random() * 0.5 + 0.5;
      colors[i * 3 + 1] = Math.random() * 0.5 + 0.5;
      colors[i * 3 + 2] = Math.random() * 0.5 + 0.5;
      
      sizes[i] = Math.random() * 0.5 + 0.1;
    }

    particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particles.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    particles.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      sizeAttenuation: true,
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);
    particleSystemRef.current = particleSystem;

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      if (particleSystemRef.current) {
        particleSystemRef.current.rotation.y += particleSpeed;
        
        // pulsing effect during spin
        if (isSpinning) {
          const scale = 1 + Math.sin(Date.now() * 0.005) * 0.1;
          particleSystemRef.current.scale.set(scale, scale, scale);
        } else {
          particleSystemRef.current.scale.set(1, 1, 1);
        }
      }
      
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

  const spinWheel = async (betAmount: string) => {
    if (isSpinning) return;
    setError(null);
    setIsSpinning(true);
    setCountdown(COUNTDOWN_DURATION);

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

      const formattedPrizes = (response.data as Prize[]).map((prize: Prize) => ({
        ...prize,
        name: `X${parseFloat(prize.value).toString().replace(/\.0+$/, "")}`,
      }));
      setPrizes(formattedPrizes);

      const allPrizes: Prize[] = response.data as Prize[];
      const winningPrize = allPrizes.find((p) => p.probability === 100);

      if (!winningPrize) {
        console.error("No prize with 100% probability found");
        setIsSpinning(false);
        return;
      }

      const angle = calculateSpinAngle(`X${winningPrize.value}`, formattedPrizes);
      setSpinAngle(angle);

      if (wheelRef.current) {
        wheelRef.current.style.transition = `transform ${SPIN_DURATION}s cubic-bezier(0.2, 0.8, 0.3, 1)`;
        wheelRef.current.style.transform = `rotate(${angle}deg)`;
      }

      setTimeout(() => {
        setPrizeName(`X${winningPrize.value}`);
        setShowPrizeModal(true);

        setTimeout(() => {
          setShowPrizeModal(false);
          setIsSpinning(false);
        }, 3000);
      }, SPIN_DURATION * 1000);
    } catch (err: any) {
      setError(err?.message || "Transaction failed.");
      setIsSpinning(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          className="three-canvas"
          style={{ marginTop: "50px" }}
        ></canvas>
      </div>

      <h1 className="title">Spin to Win</h1>

      <div className="dropdown">
        <button
          className="button"
          onClick={() => setSelectedBetAmount((prev) => (prev === 3 ? 6 : 3))}
        >
          Select Bet Amount: {selectedBetAmount}
        </button>
      </div>

      <div className="wheel-container">
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
            {isSpinning ? "SPINNING..." : "SPIN"}
          </button>
        </div>
      </div>

      {/* Spin Experience Overlay */}
      {isSpinning && (
        <div className="spin-experience">
          <div className="countdown-bubble">
            {countdown > 0 ? (
              <div className="countdown-text">Starting in: {countdown}</div>
            ) : (
              <div className="spinning-text">SPINNING!</div>
            )}
          </div>
          
          <div className="tip-container">
            <div className="tip-bubble">
              <div className="sparkle">✨</div>
              <div className="tip-text">{currentTip}</div>
              <div className="sparkle">✨</div>
            </div>
          </div>
          
          <div className="pulse-animation"></div>
        </div>
      )}

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
                background: "radial-gradient(circle, rgba(255,215,0,0.8) 0%, rgba(255,140,0,0.9) 100%)",
                boxShadow: "0 0 50px gold",
              }}
            >
              <h2 className="congrats-text">CONGRATULATIONS!</h2>
              <h1
                className="prize-title"
                style={{
                  color: "white",
                  fontSize: "clamp(2rem, 5vw, 4rem)",
                  fontWeight: "bold",
                  textShadow: "0 0 10px #000",
                }}
              >
                YOU WON: {prizeName}
              </h1>
              <div className="confetti"></div>
              <div className="confetti"></div>
              <div className="confetti"></div>
            </div>
          </div>
        </div>
      )}

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