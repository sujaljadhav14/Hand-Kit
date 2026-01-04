import React from 'react';
import { ParticleConfig } from '../types';
import { BLEND_MODES } from '../constants';
import { Settings2, X, RotateCcw } from 'lucide-react';

interface ControlsProps {
  config: ParticleConfig;
  setConfig: React.Dispatch<React.SetStateAction<ParticleConfig>>;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  fps: number;
  onReset: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  config,
  setConfig,
  isOpen,
  setIsOpen,
  fps,
  onReset
}) => {
  const handleChange = <K extends keyof ParticleConfig>(key: K, value: ParticleConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-4 right-4 z-50 bg-black/50 backdrop-blur-md p-3 rounded-full hover:bg-black/70 transition-colors border border-white/10 text-white shadow-lg"
      >
        <Settings2 size={24} />
      </button>
    );
  }

  return (
    <div className="absolute top-4 right-4 z-50 w-80 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl text-white animate-in fade-in slide-in-from-top-5 duration-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Settings
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-1">FPS: {fps}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
            title="Reset Defaults"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <label className="text-gray-300">Density</label>
            <span className="font-mono text-xs text-gray-500">{config.count}</span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            value={config.count}
            onChange={(e) => handleChange('count', parseInt(e.target.value))}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <label className="text-gray-300">Speed</label>
            <span className="font-mono text-xs text-gray-500">{config.speed.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={config.speed}
            onChange={(e) => handleChange('speed', parseFloat(e.target.value))}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <label className="text-gray-300">Decay (Tail Length)</label>
            <span className="font-mono text-xs text-gray-500">{config.decay.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.80"
            max="0.99"
            step="0.01"
            value={config.decay}
            onChange={(e) => handleChange('decay', parseFloat(e.target.value))}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <label className="text-gray-300">Size</label>
            <span className="font-mono text-xs text-gray-500">{config.size}px</span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            value={config.size}
            onChange={(e) => handleChange('size', parseInt(e.target.value))}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <label className="text-gray-300">Gravity</label>
            <span className="font-mono text-xs text-gray-500">{config.gravity.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="-0.5"
            max="0.5"
            step="0.05"
            value={config.gravity}
            onChange={(e) => handleChange('gravity', parseFloat(e.target.value))}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-300 block">Blend Mode</label>
          <select
            value={config.blendMode}
            onChange={(e) => handleChange('blendMode', e.target.value as GlobalCompositeOperation)}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-gray-300 focus:outline-none focus:border-purple-500"
          >
            {BLEND_MODES.map((mode) => (
              <option key={mode} value={mode} className="bg-gray-900">
                {mode}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};