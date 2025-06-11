"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import "./../styles/Spin.css";
import { spinEndSignature, spinoffchain } from "@/app/url/vortex";
import { useWeb3 } from "../contexts/useWeb3";
import { VortexAddress } from "@/app/config/addresses";
import CountdownLoader from "@/components/CountdownLoader";

interface Prize {
  id: number;
  name: string;
  value: string;
  probability: number;
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
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
  const [selectedBetAmount, setSelectedBetAmount] = useState<number>(0.02);
  const [selectedToken, setSelectedToken] = useState<string>("USDT");
  const [chainMode, setChainMode] = useState<"onchain" | "offchain">("onchain");
  
  const [isWaitingSignature, setIsWaitingSignature] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [prizeName, setPrizeName] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showBetAmountPopup, setShowBetAmountPopup] = useState(false);
  const [showTokenPopup, setShowTokenPopup] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const particleSystemRef = useRef<THREE.Points | null>(null);
  const [particleSpeed, setParticleSpeed] = useState<number>(0.001);
  const particleSpeedRef = useRef(particleSpeed);
  const toastIdRef = useRef(0);
  const betAmountRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    particleSpeedRef.current = particleSpeed;
  }, [particleSpeed]);

  // Handle clicks outside popups
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (betAmountRef.current && !betAmountRef.current.contains(event.target as Node)) {
        setShowBetAmountPopup(false);
      }
      if (tokenRef.current && !tokenRef.current.contains(event.target as Node)) {
        setShowTokenPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight * 0.9);
    renderer.setPixelRatio(window.devicePixelRatio || 1);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a2a);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / (window.innerHeight * 0.9),
      0.1,
      1000
      );
    camera.position.z = 5;

    const particleCount = 500;
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

    const particlesGeom = new THREE.BufferGeometry();
    particlesGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particlesGeom.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });

    const particleSystem = new THREE.Points(particlesGeom, particleMaterial);
    particleSystemRef.current = particleSystem;
    scene.add(particleSystem);

    const animate = () => {
      requestAnimationFrame(animate);
      if (particleSystemRef.current) {
        particleSystemRef.current.rotation.y += particleSpeedRef.current;
      }
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!canvas) return;
      renderer.setSize(window.innerWidth, window.innerHeight * 0.9);
      camera.aspect = window.innerWidth / (window.innerHeight * 0.9);
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    };
  }, []);

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

  const onCountdownComplete = (prizesForCountdown: Prize[]) => {
    setShowCountdown(false);

    const winningPrize = prizesForCountdown.find((p) => p.probability === 100);
    if (!winningPrize) {
      console.error("No prize with 100% probability found");
      setIsSpinning(false);
      setParticleSpeed(0.001);
      showToast("No winning prize found", "error");
      return;
    }

    const angle = calculateSpinAngle(winningPrize.name, prizesForCountdown);
    setSpinAngle(angle);

    if (wheelRef.current) {
      wheelRef.current.style.transition = "transform 5s ease-out";
      wheelRef.current.style.transform = `rotate(${angle}deg)`;
    }

    setParticleSpeed(0.02);

    setTimeout(() => {
      setPrizeName(winningPrize.name);
      setShowPrizeModal(true);
      setParticleSpeed(0.001);

      setTimeout(() => {
        setShowPrizeModal(false);
        setIsSpinning(false);
        showToast(`You won ${winningPrize.name}!`, "success");
      }, 2000);
    }, 6000);
  };

  // on-chain spin
  const handleOnchainSpin = async (betAmount: string) => {
    setIsWaitingSignature(true);
    setParticleSpeed(0.01);

    try {
      const address = await getUserAddress();
      setUserAddress(address);

      await checkBalanceForTx(address, betAmount, VortexAddress);
      
      // Pass selectedToken to sendToken
      const txHash = await sendToken(
        VortexAddress, 
        betAmount, 
        selectedToken
        );

      const response = await spinEndSignature({
        hash: txHash,
        value: betAmount,
        userAddress: address,
      });

      const formattedPrizes: Prize[] = (response.data as Prize[]).map((prize: Prize) => ({
        ...prize,
        name: `X${parseFloat(prize.value).toString().replace(/\.0+$/, "")}`,
      }));

      setPrizes(formattedPrizes);
      setCountdownPrizes(formattedPrizes);

      setIsWaitingSignature(false);
      setShowCountdown(true);
      setIsSpinning(true);
      setParticleSpeed(0.02);
      showToast("On-chain spin initiated", "success");
    } catch (err: any) {
      const message = err?.message || "Transaction failed.";
      showToast(message, "error");
      setIsWaitingSignature(false);
      setIsSpinning(false);
      setParticleSpeed(0.001);
    }
  };

  // off-chain spin - MODIFIED TO INCLUDE TOKEN SYMBOL
  const handleOffchainSpin = async (betAmount: string) => {
    setIsWaitingSignature(true);
    setParticleSpeed(0.01);

    try {
      const address = await getUserAddress();
      setUserAddress(address);

      const response = await spinoffchain({
        address: address,
        amount: parseFloat(betAmount),
        token_symbol: selectedToken,
      });

      const formattedPrizes: Prize[] = (response.data as Prize[]).map((prize: Prize) => ({
        ...prize,
        name: `X${parseFloat(prize.value).toString().replace(/\.0+$/, "")}`,
      }));

      setPrizes(formattedPrizes);
      setCountdownPrizes(formattedPrizes);

      setIsWaitingSignature(false);
      setShowCountdown(true);
      setIsSpinning(true);
      setParticleSpeed(0.02);
      showToast("Off-chain spin initiated", "success");
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Off-chain spin failed.";
      showToast(message, "error");
      setIsWaitingSignature(false);
      setIsSpinning(false);
      setParticleSpeed(0.001);
    }
  };

  // Main spin function
  const spinWheel = async (betAmount: string) => {
    if (isWaitingSignature || showCountdown || isSpinning) return;
    
    if (chainMode === "onchain") {
      await handleOnchainSpin(betAmount);
    } else {
      await handleOffchainSpin(betAmount);
    }
  };

return (
  <div className="spin-wrapper">
    {/* Toast notifications */}
    <div className="toast-container">
      {toasts.map((t) => (
        <div 
          key={t.id} 
          className={`toast toast-${t.type}`}
        >
          {t.message}
        </div>
      ))}
    </div>

    <div className="canvas-glow-wrapper">
      <canvas ref={canvasRef} className="three-canvas"></canvas>
    </div>

    <div className="spin-content">
      <h1 className="title">Spin to Win</h1>

      {/* Bet & Token Selectors - popups */}
      <div className="flex space-x-4 p-4 bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-500 rounded-2xl backdrop-blur-md shadow-2xl animate-fade-in">
        {/* Bet Amount Selector */}
        <div className="relative group" ref={betAmountRef}>
          <div
            onClick={() => setShowBetAmountPopup(!showBetAmountPopup)}
            className="appearance-none w-28 py-2 pl-4 pr-10 rounded-lg bg-white bg-opacity-20 text-white font-semibold tracking-wide backdrop-filter backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-pink-400 transition duration-300 group-hover:scale-105 cursor-pointer"
          >
            {selectedBetAmount.toFixed(2)}
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white text-lg transform transition duration-500">
              ⬇️
            </span>
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-pink-400 rounded-full animate-pulse"></div>
          
          {/* Bet Amount Popup */}
          {showBetAmountPopup && (
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-transparent">
              <div className="ethereal-popup bet-amount-popup">
                <div className="popup-inner">
                  <div className="popup-header">
                    <h3 className="popup-title">Select Bet Amount</h3>
                    <div className="popup-aura"></div>
                  </div>
                  <div className="popup-options flex flex-wrap gap-2 justify-center">
                    {[0.02, 0.05, 0.1, 0.5, 1].map((amt) => (
                      <div 
                        key={amt}
                        className={`popup-option w-16 ${selectedBetAmount === amt ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedBetAmount(amt);
                          setShowBetAmountPopup(false);
                        }}
                      >
                        <div className="option-glow"></div>
                        <div className="option-value">{amt.toFixed(2)}</div>
                        <div className="option-particles"></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="popup-trail"></div>
              </div>
            </div>
          )}
        </div>

        {/* Token Selector */}
        <div className="relative group" ref={tokenRef}>
          <div
            onClick={() => setShowTokenPopup(!showTokenPopup)}
            className="appearance-none w-24 py-2 pl-4 pr-10 rounded-lg bg-white bg-opacity-20 text-white font-semibold tracking-wider backdrop-filter backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-300 transition duration-300 group-hover:scale-105 cursor-pointer"
          >
            {selectedToken}
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white text-xl transform transition duration-500">
              🜸
            </span>
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-purple-300 rounded-full animate-ping"></div>
          
          {/* Token Popup */}
          {showTokenPopup && (
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 bg-transparent">
              <div className="ethereal-popup token-popup">
                <div className="popup-inner">
                  <div className="popup-header">
                    <h3 className="popup-title">Select Token</h3>
                    <div className="popup-aura"></div>
                  </div>
                  <div className="popup-options flex flex-wrap gap-2 justify-center">
                    {["USDT", "CUSD", "CKES", "USDC"].map((tok) => (
                      <div 
                        key={tok}
                        className={`popup-option w-20 ${selectedToken === tok ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedToken(tok);
                          setShowTokenPopup(false);
                        }}
                      >
                        <div className="option-glow"></div>
                        <div className="option-value">{tok}</div>
                        <div className="option-particles"></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="popup-trail"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="chain-mode-selector">
        <div 
          className={`ethereal-radio ${chainMode === "onchain" ? "active" : ""}`}
          onClick={() => setChainMode("onchain")}
        >
          <div className="ethereal-glow"></div>
          <div className="radio-inner"></div>
          <span>On-Chain</span>
          <div className="particle-trail"></div>
        </div>
        
        <div 
          className={`ethereal-radio ${chainMode === "offchain" ? "active" : ""}`}
          onClick={() => setChainMode("offchain")}
        >
          <div className="ethereal-glow"></div>
          <div className="radio-inner"></div>
          <span>Off-Chain</span>
          <div className="particle-trail"></div>
        </div>
      </div>

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
            onClick={() => spinWheel(selectedBetAmount.toString())}
            disabled={isWaitingSignature || showCountdown || isSpinning}
          >
            <div className="pointer"></div>
            SPIN
          </button>
        </div>
      </div>

      {isWaitingSignature && (
        <div className="signing-banner">
          {chainMode === "onchain" 
          ? "Signing transaction… Please wait" 
          : "Processing off-chain spin…"}
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
            setShowCountdown(false);
            setIsSpinning(false);
            setParticleSpeed(0.001);
            showToast("Spin failed: No prizes loaded", "error");
          }
        }}
      />

      {showPrizeModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="box">
              <h1 className="prize-title">{prizeName}</h1>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);

};
export default Spin;
