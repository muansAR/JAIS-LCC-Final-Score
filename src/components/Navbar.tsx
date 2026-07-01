import React, { useState, useEffect } from 'react';
import { 
  Volume2, VolumeX, Settings, Fullscreen, Shield, 
  Download, FileSpreadsheet, FileJson, Image, Printer, Play
} from 'lucide-react';
import { AppSettings, SoundSettings } from '../types';
import soundEngine from '../utils/soundEngine';

interface NavbarProps {
  settings: AppSettings;
  sound: SoundSettings;
  setSound: (sound: SoundSettings) => void;
  onOpenSettings: () => void;
  onOpenProjector: () => void;
  onExportExcel: () => void;
  onExportPNG: () => void;
  onBackupJson: () => void;
  onRestoreJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPrintReport: () => void;
}

export default function Navbar({
  settings,
  sound,
  setSound,
  onOpenSettings,
  onOpenProjector,
  onExportExcel,
  onExportPNG,
  onBackupJson,
  onRestoreJson,
  onPrintReport
}: NavbarProps) {
  const [time, setTime] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Live Clock Effect
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleMute = () => {
    const newMuted = !sound.isMuted;
    setSound({ ...sound, isMuted: newMuted });
    soundEngine.setMute(newMuted);
    if (!newMuted) {
      soundEngine.playTick();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setSound({ ...sound, volume: vol });
    soundEngine.setVolume(vol);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <header className="glass-card sticky top-0 z-40 w-full px-6 py-3 shadow-lg border-b border-white/10" id="app_navbar">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        
        {/* Brand & Left Information */}
        <div className="flex items-center gap-4">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-yellow-600 shadow-lg shadow-gold/15">
            <span className="font-display text-xl font-extrabold text-slate-900">🕌</span>
            <div className="absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-success border-2 border-slate-950">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-success-hover opacity-75"></span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg font-bold tracking-tight text-white uppercase">
                {settings.competitionName || "LCC PRO SCORING SYSTEM"}
              </h1>
              <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-bold text-gold border border-gold/20 uppercase tracking-widest">
                Offline Pro
              </span>
            </div>
            <p className="font-sans text-xs font-medium text-slate-400">
              {settings.eventName || "Islamic Quiz Competition Final"}
            </p>
          </div>
        </div>

        {/* Right Controls Area */}
        <div className="flex items-center gap-5">
          
          {/* Live Clock Display */}
          <div className="hidden items-center gap-2 rounded-xl bg-slate-950/40 px-3 py-1.5 border border-white/5 md:flex">
            <span className="h-2 w-2 rounded-full bg-gold animate-pulse"></span>
            <span className="font-mono text-sm font-semibold text-gold tracking-widest neon-text-gold">
              {time}
            </span>
          </div>

          {/* Volume Settings */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-900/50 px-3 py-1.5 border border-white/5">
            <button 
              onClick={toggleMute}
              className="text-slate-400 hover:text-gold transition-colors duration-150"
              title={sound.isMuted ? "Unmute Sound" : "Mute Sound"}
              id="volume_mute_btn"
            >
              {sound.isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05"
              value={sound.isMuted ? 0 : sound.volume}
              onChange={handleVolumeChange}
              disabled={sound.isMuted}
              className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-gold disabled:opacity-40"
              title="Adjust Volume"
              id="volume_slider"
            />
          </div>

          {/* Export / Backup Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-xl bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-300 border border-white/5 hover:border-gold/30 hover:text-white transition-all duration-200"
              title="Export Data & Reports"
              id="export_menu_btn"
            >
              <Download size={16} className="text-gold" />
              <span className="hidden sm:inline">Export & Report</span>
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-56 z-50 rounded-2xl bg-slate-900 border border-white/10 p-2 shadow-2xl animate-fade-in">
                  <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 mb-1">
                    Reports
                  </div>
                  <button 
                    onClick={() => { onPrintReport(); setDropdownOpen(false); }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-gold transition-all"
                    id="export_print_pdf"
                  >
                    <Printer size={14} className="text-info" />
                    <span>Print Report / Save PDF</span>
                  </button>
                  <button 
                    onClick={() => { onExportExcel(); setDropdownOpen(false); }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-gold transition-all"
                    id="export_excel"
                  >
                    <FileSpreadsheet size={14} className="text-success" />
                    <span>Export Excel (.xls)</span>
                  </button>
                  <button 
                    onClick={() => { onExportPNG(); setDropdownOpen(false); }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-gold transition-all"
                    id="export_png_scoreboard"
                  >
                    <Image size={14} className="text-warning" />
                    <span>Save Scoreboard Image</span>
                  </button>

                  <div className="px-3 py-2 mt-2 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 mb-1">
                    System Backup
                  </div>
                  <button 
                    onClick={() => { onBackupJson(); setDropdownOpen(false); }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-gold transition-all"
                    id="export_backup_json"
                  >
                    <FileJson size={14} className="text-gold" />
                    <span>Download Backup (.json)</span>
                  </button>
                  <label 
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-gold transition-all cursor-pointer"
                    id="import_backup_label"
                  >
                    <Play size={14} className="text-violet-500 rotate-90" />
                    <span>Upload Backup (.json)</span>
                    <input 
                      type="file" 
                      accept=".json" 
                      onChange={(e) => { onRestoreJson(e); setDropdownOpen(false); }}
                      className="hidden" 
                    />
                  </label>
                </div>
              </>
            )}
          </div>

          {/* Projector Window Button */}
          <button 
            onClick={onOpenProjector}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/15 border border-indigo-500 hover:from-indigo-500 hover:to-blue-500 transition-all duration-200"
            title="Launch Projector Screen in Separate Window"
            id="launch_projector_btn"
          >
            <Fullscreen size={16} />
            <span className="hidden lg:inline">Projector Screen</span>
          </button>

          {/* Vertical Divider */}
          <span className="h-6 w-px bg-white/10"></span>

          {/* Settings Trigger */}
          <button 
            onClick={onOpenSettings}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-white/5 hover:border-gold/30 hover:text-gold text-slate-300 transition-all duration-150"
            title="Competition Settings"
            id="navbar_settings_btn"
          >
            <Settings size={18} />
          </button>

        </div>
      </div>
    </header>
  );
}
