"use client";

import React, { useEffect, useRef, useState } from "react";
import "./../styles/CountdownLoader.css";

interface CountdownLoaderProps {
  visible: boolean;
  duration?: number; // in seconds (default 10)
  onComplete: () => void;
}

const CountdownLoader: React.FC<CountdownLoaderProps> = ({
  visible,
  duration = 10,
  onComplete,
}) => {
  const loaderRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<HTMLDivElement>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  const startNumber = 100;
  const endNumber = 90;
  const digitsPerRing = 10;
  const ringRadius = 120; // px

  //background stars
  const createStars = () => {
    if (!starsRef.current) return;
    const starsContainer = starsRef.current;
    const starCount = 100;
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement("div");
      star.classList.add("star");
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      star.style.left = `${x}%`;
      star.style.top = `${y}%`;

      const size = Math.random() * 2 + 1;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;

      const durationSec = Math.random() * 5 + 2;
      const delay = Math.random() * 5;
      star.style.setProperty("--duration", `${durationSec}s`);
      star.style.animationDelay = `${delay}s`;

      starsContainer.appendChild(star);
    }
  };

  // Web Audio API
  const initAudio = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(ctx);
    } catch (e) {
      console.warn("Web Audio API not supported", e);
      setSoundOn(false);
    }
  };

  // Play one short tick
  const playTick = () => {
    if (!soundOn || !audioContext) return;
    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.type = "sine";
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.1;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.05);
    } catch {
      // ignore
    }
  };

  // ne ring at “number”
  const createRing = (number: number) => {
    playTick();
    if (!loaderRef.current) return;
    const loaderDiv = loaderRef.current;
    const ring = document.createElement("div");
    ring.className = "ring";

    // Distortion effect for numbers ≤ 87
    if (number <= 87) {
      const distortion = document.createElement("div");
      distortion.className = "distortion";
      distortion.style.background = `radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)`;
      ring.appendChild(distortion);
    }

    // digits in circular formation
    for (let i = 0; i < digitsPerRing; i++) {
      const angle = (i / digitsPerRing) * Math.PI * 2;
      const x = Math.cos(angle) * ringRadius;
      const y = Math.sin(angle) * ringRadius;

      const digit = document.createElement("div");
      digit.className = "digit";
      digit.textContent = String(number);
      digit.style.fontSize = `${Math.max(14, 32 - (startNumber - number) * 0.2)}px`;
      digit.style.transform = `translate(${x}px, ${y}px)`;
      digit.style.opacity = `${0.8 - i * 0.02}`;

      const hue = (number * 3) % 360;
      digit.style.color = `hsl(${hue}, 100%, 80%)`;

      ring.appendChild(digit);
    }

    loaderDiv.appendChild(ring);

    // Remove ring after its animation (1.2s)
    setTimeout(() => {
      ring.remove();
    }, 1200);
  };

  // Kick off the countdown from 100 → 90 over “duration” seconds.
  const startCountdown = () => {
    if (!loaderRef.current) return;
    // Clear any existing rings
    loaderRef.current.innerHTML = "";
    const totalNumbers = startNumber - endNumber + 1; 
    const intervalTime = (duration * 1000) / totalNumbers;
    let currentNumber = startNumber;

    // First two rings for dynamic start
    createRing(startNumber);
    setTimeout(() => createRing(startNumber - 1), intervalTime / 2);

    intervalRef.current = window.setInterval(() => {
      if (currentNumber > endNumber) {
        createRing(currentNumber);
        currentNumber--;
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setTimeout(() => {
          onComplete();
        }, 1200); // wait for final ring to fade (animation: 1.2s)
      }
    }, intervalTime);
  };

  // When “visible” changes to true, mount everything
  useEffect(() => {
    if (visible) {
      // Reset stars & loader
      if (starsRef.current) starsRef.current.innerHTML = "";
      createStars();
      initAudio();
      startCountdown();
      if (loaderRef.current) {
        loaderRef.current.style.opacity = "1";
      }
      // Prevent body scroll 
      document.body.style.overflow = "hidden";
    } else {
      // Clean up when hidden
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (loaderRef.current) loaderRef.current.innerHTML = "";
      if (starsRef.current) starsRef.current.innerHTML = "";
      document.body.style.overflow = "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="countdown-wrapper">
      <div className="background-stars" ref={starsRef}></div>
      <div className="container">
        <h1>Vortex</h1>
        <div className="subtitle">Home of risk takers!!</div>
        <div className="loader-container" ref={loaderRef}></div>
        <div className="controls">
          <button
            id="toggle-sound"
            onClick={() => setSoundOn((prev) => !prev)}
          >
            {soundOn ? "Sound: ON" : "Sound: OFF"}
          </button>
        </div>
        <div className="footer">
          Good Luck!
        </div>
      </div>
    </div>
  );
};

export default CountdownLoader;
