'use client';

import React, { useState } from 'react';
import { CrownIcon } from './icons/CrownIcon';
import { Send, Check, X, ExternalLink } from 'lucide-react';
import { useKingStream } from './KingStreamContext';

export function KingStreamFloatingButton() {
  const { telegramConfig } = useKingStream();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(telegramConfig.channelHandle || '@KingStreamOfficial');
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
          {telegramConfig.channelName || 'Channel Tele KingStream'}
        </button>

        {/* Purple Circle Crown Button */}
        <button
          onClick={() => setShowModal(true)}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-[#6b21a8] to-[#9333ea] hover:from-[#7e22ce] hover:to-[#a855f7] flex items-center justify-center text-white shadow-xl shadow-purple-950/60 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer"
          aria-label="Open Telegram Channel"
        >
          <CrownIcon className="w-5 h-5 text-white drop-shadow" />
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

            <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-sky-900/40">
              <Send className="w-7 h-7 -translate-x-0.5 translate-y-0.5" />
            </div>

            <h4 className="text-lg font-bold text-white">Join Channel Telegram</h4>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Dapatkan link video terbaru, notifikasi update harian, dan bocoran konten eksklusif di channel resmi kami!
            </p>

            <div className="mt-4 p-2.5 bg-purple-950/40 border border-purple-800/30 rounded-xl flex items-center justify-between">
              <span className="text-xs font-mono text-purple-300">
                {telegramConfig.channelHandle || '@KingStreamOfficial'}
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
