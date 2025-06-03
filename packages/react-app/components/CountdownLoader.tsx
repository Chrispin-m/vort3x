"use client";

import React, { useEffect, useRef } from "react";
import "./../styles/CountdownLoader.css";

interface CountdownLoaderProps {
  /** Show or hide the loader */
  visible: boolean;
  duration?: number;
  startNumber?: number;
  endNumber?: number;
  onComplete?: () => void;
}

const CountdownLoader: React.FC<CountdownLoaderProps> = ({
  visible,
  duration = 10,
  startNumber = 100,
  endNumber = 90,
  onComplete = () => {},
}) => {
  const starsContainerRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);

  /** twinkling stars background */
  const createStars = () => {
    const starsContainer = starsContainerRef.current;
    if (!starsContainer) return;
    starsContainer.innerHTML = ""; // clear any previous
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
      const durationVar = Math.random() * 5 + 2;
      const delayVar = Math.random() * 5;
      star.style.setProperty("--duration", `${durationVar}s`);
      star.style.animationDelay = `${delayVar}s`;

      starsContainer.appendChild(star);
    }
  };

  let audioContext: AudioContext | null = null;
  let soundOn = true;
  const initAudio = () => {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      soundOn = false;
    }
  };
  const playTick = () => {
    if (!soundOn || !audioContext) return;
    try {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.type = "sine";
      osc.frequency.value = 800;
      gain.gain.value = 0.1;
      osc.start();
      osc.stop(audioContext.currentTime + 0.05);
    } catch {
      // fail silently
    }
  };

  const createRing = (number: number) => {
    playTick();
    const loader = loaderRef.current;
    if (!loader) return;

    const ring = document.createElement("div");
    ring.className = "ring";

    // If number ≤ 87, add distortion behind it
    if (number <= 87) {
      const distortion = document.createElement("div");
      distortion.className = "distortion";
      distortion.style.background = `radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)`;
      ring.appendChild(distortion);
    }

    const digitsPerRing = 10;
    const ringRadius = 120;
    for (let i = 0; i < digitsPerRing; i++) {
      const angle = (i / digitsPerRing) * Math.PI * 2;
      const x = Math.cos(angle) * ringRadius;
      const y = Math.sin(angle) * ringRadius;
      const digit = document.createElement("div");
      digit.className = "digit";
      digit.textContent = number.toString();
      const fontSize = Math.max(14, 32 - (startNumber - number) * 0.2);
      digit.style.fontSize = `${fontSize}px`;
      digit.style.transform = `translate(${x}px, ${y}px)`;
      digit.style.opacity = `${0.8 - i * 0.02}`;
      const hue = (number * 3) % 360;
      digit.style.color = `hsl(${hue}, 100%, 80%)`;
      ring.appendChild(digit);
    }

    loader.appendChild(ring);
    setTimeout(() => {
      ring.remove();
    }, 1200);
  };

  const startCountdown = () => {
    const loader = loaderRef.current;
    if (!loader) return;
    loader.style.opacity = "1";

    let currentNumber = startNumber;
    const totalNumbers = startNumber - endNumber + 1;
    const intervalTime = (duration * 1000) / totalNumbers;

    createRing(startNumber);
    setTimeout(() => {
      createRing(startNumber - 1);
    }, intervalTime / 2);

    intervalRef.current = window.setInterval(() => {
      if (currentNumber >= endNumber) {
        createRing(currentNumber);
        currentNumber--;
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setTimeout(() => {
          if (loader) loader.style.opacity = "0";
          setTimeout(() => {
            document.body.style.backgroundColor = "#111";
            onComplete();
          }, 1000);
        }, 1200);
      }
    }, intervalTime);
  };

  useEffect(() => {
    if (!visible) {
      // If loader is hidden, make sure to clear any intervals
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    initAudio();
    createStars();
    setTimeout(startCountdown, 100);
    // Cleanup on unmount or visible→false
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="countdown-overlay">
      <div className="background-stars" ref={starsContainerRef}></div>
      <div className="container">
        <h1>Vortex</h1>
        <div className="subtitle">Home of risk takers!!...</div>
        <div className="loader-container" ref={loaderRef}></div>
        {/*omitted the “Restart” and “Sound” controls intended as a one-shot overlay. */}
        <div className="footer">
          Goodluck!...
        </div>
      </div>
    </div>
  );
};

export default CountdownLoader;
