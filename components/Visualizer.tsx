import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as mpHands from '@mediapipe/hands';
import { HandLandmark, Point, Particle, ParticleConfig, Results, ParticleMode, HandGesture } from '../types';
import { VIDEO_WIDTH, VIDEO_HEIGHT } from '../constants';
import { Loader2, Camera as CameraIcon } from 'lucide-react';

// Fix for MediaPipe ESM import issues
const Hands = (mpHands as any).Hands || (mpHands as any).default?.Hands || (mpHands as any).default;

interface VisualizerProps {
  config: ParticleConfig;
  setFps: (fps: number) => void;
  currentMode: ParticleMode;
  setMode: React.Dispatch<React.SetStateAction<ParticleMode>>;
  setGesture: (gesture: HandGesture) => void;
}

export const Visualizer: React.FC<VisualizerProps> = ({ config, setFps, currentMode, setMode, setGesture }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsTimerRef = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const landmarksRef = useRef<any[]>([]);
  const gestureRef = useRef<HandGesture>('NONE');
  const lastSwitchTimeRef = useRef<number>(0);

  // Shape generation Helpers
  const generateHeartPoint = (t: number, scale: number, cx: number, cy: number) => {
    // Heart parametric equation
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
    return {
      x: cx + x * scale,
      y: cy + y * scale
    };
  };

  const generateSpherePoint = (i: number, count: number, scale: number, cx: number, cy: number, time: number) => {
    // Golden spiral on sphere
    const phi = Math.acos(1 - 2 * (i + 0.5) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i + time * 0.001;
    
    const x = Math.cos(theta) * Math.sin(phi);
    const z = Math.sin(theta) * Math.sin(phi); // Z used for depth rotation usually
    const y = Math.cos(phi);

    // Rotate sphere slowly over time
    const rotX = x * Math.cos(time * 0.0005) - z * Math.sin(time * 0.0005);
    
    return {
      x: cx + rotX * scale,
      y: cy + y * scale,
    };
  };

  // Initialize/Re-initialize Pool based on mode
  const initParticlePool = useCallback((mode: ParticleMode) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    // For Shapes, we want a fixed number of particles that persist
    // For Trails, we use the pool as a recycling buffer
    
    // Reset pool if needed or just re-assign targets
    if (particlesRef.current.length === 0) {
        for (let i = 0; i < 1500; i++) {
            particlesRef.current.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 0,
                maxLife: 1,
                size: Math.random() * config.size + 1,
                hue: Math.random() * 360
            });
        }
    }
  }, [config.size]);


  const updateParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const time = Date.now();

    const hand = landmarksRef.current[0]; // Primary hand
    const gesture = gestureRef.current;
    const interactionForce = gesture === 'FIST' ? -1 : (gesture === 'OPEN' ? 1 : 0);

    // MODE: TRAILS (Classic)
    if (currentMode === 'TRAILS') {
        // Spawn
        if (hand) {
            const indexTip = hand[HandLandmark.INDEX_FINGER_TIP];
            const px = indexTip.x * canvas.width;
            const py = indexTip.y * canvas.height;
            
            // Find dead particles to respawn
            let spawnCount = 0;
            for (let i = 0; i < particlesRef.current.length; i++) {
                if (spawnCount >= config.count) break;
                if (particlesRef.current[i].life <= 0) {
                    const p = particlesRef.current[i];
                    p.x = px;
                    p.y = py;
                    const angle = Math.random() * Math.PI * 2;
                    const s = Math.random() * config.speed;
                    p.vx = Math.cos(angle) * s;
                    p.vy = Math.sin(angle) * s;
                    p.life = 1;
                    p.hue = (time / 20) % 360;
                    spawnCount++;
                }
            }
        }

        // Update
        particlesRef.current.forEach(p => {
            if (p.life > 0) {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += config.gravity;
                p.life -= (1 - config.decay);
            }
        });
    }

    // MODE: HEART & SPHERE (Target Seeking)
    else if (currentMode === 'HEART' || currentMode === 'SPHERE') {
        const count = particlesRef.current.length;
        const scale = currentMode === 'HEART' ? 15 : 200;

        particlesRef.current.forEach((p, i) => {
            // Determine Target
            let tx = cx, ty = cy;
            
            if (currentMode === 'HEART') {
                // Map particle index to parameter t
                const t = (i / count) * Math.PI * 2;
                const pt = generateHeartPoint(t, scale, cx, cy);
                tx = pt.x;
                ty = pt.y;
            } else {
                const pt = generateSpherePoint(i, count, scale, cx, cy, time);
                tx = pt.x;
                ty = pt.y;
            }

            // Interaction: Open Palm expands/explodes the shape
            if (gesture === 'OPEN') {
                const dx = p.x - cx;
                const dy = p.y - cy;
                tx = cx + dx * 1.5;
                ty = cy + dy * 1.5;
            }
            // Interaction: Fist contracts tightly
            if (gesture === 'FIST') {
                tx = cx;
                ty = cy;
            }

            // Physics: Spring to target
            const dx = tx - p.x;
            const dy = ty - p.y;
            
            p.vx += dx * 0.05; // Spring strength
            p.vy += dy * 0.05;
            p.vx *= 0.8; // Friction
            p.vy *= 0.8;
            
            p.x += p.vx;
            p.y += p.vy;
            p.life = 1; // Always visible
            p.hue = (i % 60) + (time / 50); // Gradient color
        });
    }

    // MODE: FIREWORKS (Warp Speed)
    else if (currentMode === 'FIREWORKS') {
        particlesRef.current.forEach(p => {
            // If dead or out of bounds, reset to center
            if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
                p.x = cx + (Math.random() - 0.5) * 50;
                p.y = cy + (Math.random() - 0.5) * 50;
                p.vx = (Math.random() - 0.5) * 2;
                p.vy = (Math.random() - 0.5) * 2;
            }

            // Base repulsion from center
            const dx = p.x - cx;
            const dy = p.y - cy;
            const dist = Math.sqrt(dx*dx + dy*dy) + 0.1;
            
            // Standard expansion
            let force = 0.5;

            // Interaction
            if (gesture === 'FIST') {
                // Attract (Reverse Time)
                force = -2.0;
            } else if (gesture === 'OPEN') {
                // Hyper Speed
                force = 5.0;
            }

            p.vx += (dx / dist) * force * 0.5;
            p.vy += (dy / dist) * force * 0.5;

            p.x += p.vx;
            p.y += p.vy;
            
            // Drag
            p.vx *= 0.95;
            p.vy *= 0.95;
            
            p.life = Math.min(dist / 400, 1);
            p.hue = (dist / 2) % 360;
        });
    }
  };

  const drawParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = config.blendMode;

    particlesRef.current.forEach(p => {
      if (p.life > 0.05) {
        ctx.beginPath();
        // Dynamic size based on mode
        const size = currentMode === 'FIREWORKS' ? p.size * (p.life * 2) : p.size;
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${p.life})`;
        ctx.fill();
      }
    });

    ctx.globalCompositeOperation = 'source-over';
  };

  const loop = useCallback((time: number) => {
    if (time - fpsTimerRef.current >= 1000) {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      fpsTimerRef.current = time;
    }
    frameCountRef.current++;

    updateParticles();
    drawParticles();
    animationRef.current = requestAnimationFrame(loop);
  }, [config, setFps, currentMode]);

  useEffect(() => {
    initParticlePool(currentMode);
    animationRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [loop, currentMode, initParticlePool]);

  // Gesture Detection
  const detectGesture = (landmarks: any[]): HandGesture => {
    if (!landmarks) return 'NONE';

    const thumbTip = landmarks[HandLandmark.THUMB_TIP];
    const indexTip = landmarks[HandLandmark.INDEX_FINGER_TIP];
    const wrist = landmarks[HandLandmark.WRIST];
    
    // Pinch Detection (Thumb tip close to Index tip)
    const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
    if (pinchDist < 0.05) return 'PINCH';

    // Fist Detection (Average distance of tips to wrist)
    const tips = [
        landmarks[HandLandmark.INDEX_FINGER_TIP],
        landmarks[HandLandmark.MIDDLE_FINGER_TIP],
        landmarks[HandLandmark.RING_FINGER_TIP],
        landmarks[HandLandmark.PINKY_TIP]
    ];
    
    let totalDist = 0;
    tips.forEach(tip => {
        totalDist += Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
    });
    const avgDist = totalDist / 4;
    
    // Thresholds depend on hand distance from camera, but normalized coords help.
    // 0.2 is roughly a fist, > 0.4 is open hand
    if (avgDist < 0.25) return 'FIST';
    if (avgDist > 0.35) return 'OPEN';

    return 'NONE';
  };

  const onResults = useCallback((results: Results) => {
    if (!canvasRef.current || !webcamRef.current?.video) return;

    const videoWidth = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const rawLandmarks = results.multiHandLandmarks[0];
        
        // Store landmarks for physics
        landmarksRef.current = [rawLandmarks];
        
        // Detect Gesture
        const gesture = detectGesture(rawLandmarks);
        gestureRef.current = gesture;
        setGesture(gesture);

        // Handle Mode Switch (Debounced Pinch)
        if (gesture === 'PINCH') {
            const now = Date.now();
            if (now - lastSwitchTimeRef.current > 1000) { // 1 second cooldown
                lastSwitchTimeRef.current = now;
                setMode(prev => {
                    const modes: ParticleMode[] = ['TRAILS', 'FIREWORKS', 'HEART', 'SPHERE'];
                    const idx = modes.indexOf(prev);
                    return modes[(idx + 1) % modes.length];
                });
            }
        }
    } else {
        landmarksRef.current = [];
        gestureRef.current = 'NONE';
        setGesture('NONE');
    }
    setIsLoading(false);
  }, [setMode, setGesture]);

  useEffect(() => {
    if (!Hands) {
      setCameraError("Failed to load MediaPipe Hands library.");
      setIsLoading(false);
      return;
    }

    const hands = new Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1, // Single hand for control is cleaner
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults(onResults);

    let isCancelled = false;
    let requestMetadataId: number;

    const detect = async () => {
        if (isCancelled) return;
        if (webcamRef.current?.video?.readyState === 4) {
            try {
                await hands.send({ image: webcamRef.current.video });
            } catch (error) {
                console.error("MediaPipe detection error:", error);
            }
        }
        if (!isCancelled) requestMetadataId = requestAnimationFrame(detect);
    };

    detect();

    return () => {
      isCancelled = true;
      if (requestMetadataId) cancelAnimationFrame(requestMetadataId);
      hands.close();
    };
  }, [onResults]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
        {isLoading && !cameraError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white">
                <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
                <p className="text-lg font-light tracking-wider">Initializing Computer Vision...</p>
            </div>
        )}
        {cameraError && (
             <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 text-white p-8 text-center">
                <CameraIcon className="w-16 h-16 text-red-500 mb-6" />
                <h2 className="text-2xl font-bold mb-2">Camera Error</h2>
                <p className="text-gray-300 max-w-md">{cameraError}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="mt-8 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                    Reload Page
                </button>
            </div>
        )}
        <div className="relative w-full h-full">
            <Webcam
                ref={webcamRef}
                audio={false}
                width={VIDEO_WIDTH}
                height={VIDEO_HEIGHT}
                screenshotFormat="image/jpeg"
                videoConstraints={{ width: VIDEO_WIDTH, height: VIDEO_HEIGHT, facingMode: "user" }}
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-0" // Hide webcam, only show particles
            />
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            />
             {/* Pip Camera View for feedback */}
             <div className="absolute bottom-4 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black">
                <Webcam
                    audio={false}
                    width={192}
                    height={144}
                    videoConstraints={{ facingMode: "user" }}
                    className="w-full h-full object-cover scale-x-[-1]"
                />
            </div>
        </div>
    </div>
  );
};