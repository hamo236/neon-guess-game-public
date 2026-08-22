import React from 'react';
import { Link } from 'react-router-dom';

const AdminGateway = () => {
  return (
    <div className="bg-background text-on-surface min-h-screen flex items-center justify-center p-container-margin overflow-hidden relative">
      <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')"}}></div>
      
      <div className="glass-card backdrop-blur-xl border border-t-white/20 border-b-white/5 border-l-white/10 border-r-white/5 rounded-2xl p-stack-lg max-w-md w-full relative z-10 shadow-2xl flex flex-col items-center">
        
        <div className="mb-stack-lg relative group">
          <div className="absolute inset-0 bg-primary-fixed blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 rounded-full"></div>
          <div className="h-20 w-20 rounded-full bg-white/5 border border-white/20 flex items-center justify-center relative z-10 backdrop-blur-md">
            <span className="material-symbols-outlined text-primary-fixed text-4xl">admin_panel_settings</span>
          </div>
        </div>

        <div className="text-center mb-stack-lg w-full">
          <h1 className="font-display-lg text-display-lg text-primary-fixed uppercase tracking-tighter mb-stack-sm drop-shadow-[0_0_8px_rgba(125,244,255,0.3)]">Admin Lock</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">System access requires master clearance.</p>
        </div>

        <div className="w-full mb-stack-lg">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-4 text-on-surface-variant">lock</span>
            <input 
              className="w-full bg-white/5 border-0 border-b-2 border-transparent focus:border-primary-fixed focus:ring-0 text-on-surface font-body-lg text-body-lg px-4 py-3 pl-12 rounded-t-lg transition-colors placeholder-on-surface-variant/50 focus:bg-white/10 outline-none" 
              placeholder="Enter Master Password" 
              type="password" 
            />
          </div>
        </div>

        <button className="w-full relative group overflow-hidden rounded-lg">
          <div className="absolute inset-0 bg-primary opacity-50 blur-md group-hover:opacity-80 transition-opacity duration-300"></div>
          <div className="relative bg-primary text-on-primary-fixed-variant font-label-caps text-label-caps py-4 px-6 flex items-center justify-center gap-gutter active:scale-95 transition-transform duration-150">
            <span className="material-symbols-outlined text-xl">key</span>
            <span>UNLOCK SYSTEM</span>
          </div>
        </button>

        <div className="mt-stack-lg w-full text-center">
          <Link to="/" className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary-fixed transition-colors">
            Return to Lobby
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminGateway;
