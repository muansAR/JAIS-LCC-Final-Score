import React, { useState } from 'react';
import { X, Settings, ShieldAlert, Check, RefreshCw, Save } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onClose: () => void;
  onSaveSettings: (settings: AppSettings) => void;
}

export default function SettingsModal({
  isOpen,
  settings,
  onClose,
  onSaveSettings
}: SettingsModalProps) {
  const [compName, setCompName] = useState(settings.competitionName);
  const [evtName, setEvtName] = useState(settings.eventName);
  const [operator, setOperator] = useState(settings.operatorName);
  const [judge1, setJudge1] = useState(settings.judgeNames[0] || 'Judge A');
  const [judge2, setJudge2] = useState(settings.judgeNames[1] || 'Judge B');
  const [judge3, setJudge3] = useState(settings.judgeNames[2] || 'Judge C');
  const [defTimer, setDefTimer] = useState(settings.timerDuration);

  // Scoring points state
  const [ptsCorrectR1, setPtsCorrectR1] = useState(settings.pointsCorrectR1);
  const [ptsWrongR1, setPtsWrongR1] = useState(settings.pointsWrongR1);
  const [ptsCorrectR2, setPtsCorrectR2] = useState(settings.pointsCorrectR2);
  const [ptsPassedCorrectR2, setPtsPassedCorrectR2] = useState(settings.pointsPassedCorrectR2);
  const [ptsPassedWrongR2, setPtsPassedWrongR2] = useState(settings.pointsPassedWrongR2);
  const [ptsCorrectR3, setPtsCorrectR3] = useState(settings.pointsCorrectR3);
  const [ptsWrongR3, setPtsWrongR3] = useState(settings.pointsWrongR3);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      competitionName: compName.trim() || "LCC PRO SCORING SYSTEM",
      eventName: evtName.trim() || "Islamic Quiz Competition Final",
      operatorName: operator.trim() || "Operator",
      judgeNames: [judge1.trim() || 'Judge A', judge2.trim() || 'Judge B', judge3.trim() || 'Judge C'],
      timerDuration: defTimer || 10,
      pointsCorrectR1: ptsCorrectR1,
      pointsWrongR1: ptsWrongR1,
      pointsCorrectR2: ptsCorrectR2,
      pointsPassedCorrectR2: ptsPassedCorrectR2,
      pointsPassedWrongR2: ptsPassedWrongR2,
      pointsCorrectR3: ptsCorrectR3,
      pointsWrongR3: ptsWrongR3
    });
    onClose();
  };

  const handleResetDefaults = () => {
    if (window.confirm("Are you sure you want to restore all configuration values back to official tournament rules? This does not wipe team scores.")) {
      setCompName("LCC PRO SCORING SYSTEM");
      setEvtName("Islamic Quiz Competition Final");
      setOperator("Operator");
      setJudge1("Judge 1");
      setJudge2("Judge 2");
      setJudge3("Judge 3");
      setDefTimer(10);
      setPtsCorrectR1(100);
      setPtsWrongR1(-50);
      setPtsCorrectR2(100);
      setPtsPassedCorrectR2(50);
      setPtsPassedWrongR2(-50);
      setPtsCorrectR3(100);
      setPtsWrongR3(-100);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="settings_modal_root">
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose}></div>
      
      {/* Modal Card content */}
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl animate-scale-up overflow-y-auto max-h-[90vh]">
        
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <Settings className="text-gold animate-spin-slow h-5 w-5" />
            <h3 className="font-display text-lg font-bold text-white uppercase tracking-tight">
              Scoring System Configuration
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg bg-slate-950 p-1.5 text-slate-400 hover:text-white border border-white/5"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Configuration Forms */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECTION 1: COMPETITION METADATA */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gold uppercase tracking-widest border-b border-white/5 pb-1">
              1. Competition & Event Info
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Competition Title</label>
                <input 
                  type="text" 
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-gold outline-none"
                  placeholder="LCC PRO SCORING SYSTEM"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Event Subtitle</label>
                <input 
                  type="text" 
                  value={evtName}
                  onChange={(e) => setEvtName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-gold outline-none"
                  placeholder="Islamic Quiz Competition Final"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Operator Name</label>
                <input 
                  type="text" 
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-gold outline-none"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Judge 1 Name</label>
                <input 
                  type="text" 
                  value={judge1}
                  onChange={(e) => setJudge1(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-gold outline-none"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Judge 2 Name</label>
                <input 
                  type="text" 
                  value={judge2}
                  onChange={(e) => setJudge2(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-gold outline-none"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Judge 3 Name</label>
                <input 
                  type="text" 
                  value={judge3}
                  onChange={(e) => setJudge3(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-gold outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: TIMER RULES */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gold uppercase tracking-widest border-b border-white/5 pb-1">
              2. Default Timer Limits
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Default Countdown Time (seconds)</label>
                <input 
                  type="number" 
                  min="3"
                  max="60"
                  value={defTimer}
                  onChange={(e) => setDefTimer(parseInt(e.target.value) || 10)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-gold outline-none font-mono"
                />
              </div>
              <div className="text-xs text-slate-400 flex items-center bg-slate-950/40 p-3 rounded-xl border border-white/5">
                💡 Change the default seconds allocated to the timer circle. Standard tournament regulations usually allocate 10 seconds.
              </div>
            </div>
          </div>

          {/* SECTION 3: SCORING POINTS RULES */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gold uppercase tracking-widest border-b border-white/5 pb-1">
              3. Custom Scoring Rules
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Round 1 Points */}
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-white/5 space-y-3">
                <h5 className="text-[11px] font-bold text-white uppercase tracking-wider">Round 1 (Mandatory)</h5>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Correct Answer</label>
                  <input 
                    type="number" 
                    value={ptsCorrectR1}
                    onChange={(e) => setPtsCorrectR1(parseInt(e.target.value) || 100)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Wrong Answer</label>
                  <input 
                    type="number" 
                    value={ptsWrongR1}
                    onChange={(e) => setPtsWrongR1(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Round 2 Points */}
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-white/5 space-y-3">
                <h5 className="text-[11px] font-bold text-white uppercase tracking-wider">Round 2 (Lemparan)</h5>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Owner Correct</label>
                  <input 
                    type="number" 
                    value={ptsCorrectR2}
                    onChange={(e) => setPtsCorrectR2(parseInt(e.target.value) || 100)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Passed Correct</label>
                  <input 
                    type="number" 
                    value={ptsPassedCorrectR2}
                    onChange={(e) => setPtsPassedCorrectR2(parseInt(e.target.value) || 50)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Passed Wrong</label>
                  <input 
                    type="number" 
                    value={ptsPassedWrongR2}
                    onChange={(e) => setPtsPassedWrongR2(parseInt(e.target.value) || -50)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Round 3 Points */}
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-white/5 space-y-3">
                <h5 className="text-[11px] font-bold text-white uppercase tracking-wider">Round 3 (Rebutan)</h5>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Correct Answer</label>
                  <input 
                    type="number" 
                    value={ptsCorrectR3}
                    onChange={(e) => setPtsCorrectR3(parseInt(e.target.value) || 100)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Wrong Answer</label>
                  <input 
                    type="number" 
                    value={ptsWrongR3}
                    onChange={(e) => setPtsWrongR3(parseInt(e.target.value) || -100)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SAVE AND UTILITY ACTIONS */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-white/5 pt-5 gap-3">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-950 text-slate-400 hover:text-white border border-white/10 text-xs font-semibold hover:border-white/20 transition cursor-pointer"
            >
              <RefreshCw size={12} className="animate-spin-slow" />
              <span>Restore Rules Defaults</span>
            </button>

            <div className="flex gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-750 hover:text-white transition"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gold text-slate-950 font-extrabold text-xs hover:bg-gold-hover shadow-lg shadow-gold/15 transition cursor-pointer"
              >
                <Save size={14} />
                <span>SAVE CONFIGURATION</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
