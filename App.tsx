import React, { useState } from 'react';
import { Visualizer } from './components/Visualizer';
import { Controls } from './components/Controls';
import { DEFAULT_CONFIG } from './constants';
import { ParticleConfig, ParticleMode, HandGesture } from './types';
import { Hand, Activity, Zap, Heart, Globe } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<ParticleConfig>(DEFAULT_CONFIG);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [fps, setFps] = useState(0);
  
  // App State
  const [currentMode, setMode] = useState<ParticleMode>('TRAILS');
  const [currentGesture, setGesture] = useState<HandGesture>('NONE');

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const getModeIcon = () => {
    switch (currentMode) {
        case 'TRAILS': return <Activity className="text-blue-400" />;
        case 'FIREWORKS': return <Zap className="text-yellow-400" />;
        case 'HEART': return <Heart className="text-pink-400" />;
        case 'SPHERE': return <Globe className="text-cyan-400" />;
    }
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex flex-col font-sans">
      
      {/* HUD Overlay - Top Left */}
      <div className="absolute top-8 left-8 z-30 pointer-events-none space-y-2">
        <h1 className="text-4xl font-black text-white tracking-tighter drop-shadow-lg">
            Hand-Tracked Particles
        </h1>
        <div className="flex items-center gap-2 text-xl font-bold text-gray-200">
            Current Template: 
            <span className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                {getModeIcon()}
                {currentMode}
            </span>
        </div>
        <div className="text-sm font-medium text-gray-400 bg-black/40 px-3 py-2 rounded-lg backdrop-blur-md inline-block border border-white/5">
            Open Palm: Expand | Fist: Attract | Switch Mode: Pinch (Index & Thumb)
        </div>
        
        {/* Gesture Debug */}
        <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase tracking-widest">Detected Gesture:</span>
            <span className={`text-lg font-bold ${currentGesture === 'NONE' ? 'text-gray-600' : 'text-green-400'}`}>
                {currentGesture}
            </span>
        </div>
      </div>

      {/* Main Visualizer Area */}
      <main className="flex-1 relative">
        <Visualizer 
            config={config} 
            setFps={setFps}
            currentMode={currentMode}
            setMode={setMode}
            setGesture={setGesture}
        />
      </main>

      {/* Controls Overlay */}
      <Controls
        config={config}
        setConfig={setConfig}
        isOpen={isControlsOpen}
        setIsOpen={setIsControlsOpen}
        fps={fps}
        onReset={handleReset}
      />
    </div>
  );
}