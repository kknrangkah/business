'use client';

import React, { useState } from 'react';
import { Send, Check, X, ExternalLink } from 'lucide-react';
import { useKingStream } from './KingStreamContext';

export function KingStreamFloatingButton() {
  const { telegramConfig } = useKingStream();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(telegramConfig.channelHandle || '@Stream18Official');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Floating Widget in bottom-right corner */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 select-none">
        {/* Pill Button */}
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#150B2A]/90 hover:bg-[#1f103d] border border-[#2e1d52] hover:border-purple-500/60 text-slate-200 text-xs sm:text-sm font-medium px-4 py-2 rounded-full shadow-xl shadow-black/40 backdrop-blur-md transition-all duration-200 cursor-pointer active:scale-95"
        >
          {telegramConfig.channelName && telegramConfig.channelName !== 'Channel Tele KingStream'
            ? telegramConfig.channelName
            : 'Channel Tele Stream18+'}
        </button>

        {/* Custom 18+ Brand Logo Button */}
        <button
          onClick={() => setShowModal(true)}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#150B2A]/90 border border-purple-600/50 hover:border-purple-400 flex items-center justify-center p-1 shadow-xl shadow-purple-950/70 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer"
          aria-label="Open Telegram Channel"
        >
          <img
            src="/images/kingstream-logo.png"
            alt="Stream18+"
            className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]"
          />
        </button>
      </div>

      {/* Telegram Channel Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#150b29] border border-purple-800/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative text-center">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 mx-auto flex items-center justify-center mb-3">
              <img
                src="/images/kingstream-logo.png"
                alt="Stream18+"
                className="w-full h-full object-contain drop-shadow-[0_0_14px_rgba(168,85,247,0.65)]"
              />
            </div>

            <h4 className="text-lg font-bold text-white flex items-center justify-center gap-1.5">
              <Send className="w-4 h-4 text-sky-400" />
              <span>Join Channel Telegram</span>
            </h4>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Dapatkan link video terbaru, notifikasi update harian, dan bocoran konten eksklusif di channel resmi kami!
            </p>

            <div className="mt-4 p-2.5 bg-purple-950/40 border border-purple-800/30 rounded-xl flex items-center justify-between">
              <span className="text-xs font-mono text-purple-300">
                {telegramConfig.channelHandle || '@Stream18Official'}
              </span>
              <button
                onClick={handleCopy}
                className="text-xs bg-purple-900/50 hover:bg-purple-800/60 text-slate-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>

            <div className="mt-5 flex gap-2.5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-purple-950/50 hover:bg-purple-900/40 text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                Tutup
              </button>
              <a
                href={telegramConfig.channelUrl || 'https://t.me/KingStreamOfficial'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-sky-950 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Buka Telegram
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
