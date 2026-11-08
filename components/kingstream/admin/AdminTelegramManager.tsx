'use client';

import React, { useState } from 'react';
import { Send, Check, ExternalLink, RefreshCw } from 'lucide-react';
import { useKingStream } from '../KingStreamContext';
import { TelegramConfig, DEFAULT_TELEGRAM_CONFIG } from '@/lib/kingstream-storage';
import { CrownIcon } from '../icons/CrownIcon';
import { toast } from 'sonner';

export function AdminTelegramManager() {
  const { telegramConfig, updateTelegramConfig } = useKingStream();

  const [formData, setFormData] = useState<TelegramConfig>({
    ...telegramConfig,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.channelUrl.trim()) {
      toast.error('URL Telegram wajib diisi!');
      return;
    }
    updateTelegramConfig(formData);
    toast.success('Pengaturan Telegram berhasil disimpan ke landing page!');
  };

  const handleReset = () => {
    setFormData(DEFAULT_TELEGRAM_CONFIG);
    updateTelegramConfig(DEFAULT_TELEGRAM_CONFIG);
    toast.info('Pengaturan Telegram direset ke default');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#130A24] border border-[#2b1848] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-sky-400" />
            <span>Pengaturan Channel Telegram</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Atur link dan teks widget tombol mengambang di pojok kanan bawah landing page
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="p-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 text-slate-300 hover:text-white border border-purple-800/40 transition cursor-pointer self-start sm:self-auto"
          title="Reset ke Default"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Live Preview Box */}
      <div className="bg-[#150B2A] border border-purple-800/50 rounded-2xl p-6 shadow-xl">
        <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-3">
          Pratinjau Widget Mengambang (Pojok Kanan Bawah)
        </h3>

        <div className="py-6 px-4 bg-[#0D061A] rounded-xl border border-purple-950/60 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="bg-[#150B2A] border border-[#2e1d52] text-slate-200 text-xs sm:text-sm font-medium px-4 py-2 rounded-full shadow-lg">
              {formData.channelName || 'Channel Tele KingStream'}
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#6b21a8] to-[#9333ea] flex items-center justify-center text-white shadow-lg shadow-purple-950">
              <CrownIcon className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Form Settings */}
      <form onSubmit={handleSave} className="bg-[#130A24] border border-[#2b1848] rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Nama Teks Tombol
          </label>
          <input
            type="text"
            value={formData.channelName}
            onChange={(e) => setFormData({ ...formData, channelName: e.target.value })}
            placeholder="Channel Tele KingStream"
            className="w-full bg-[#0D061A] border border-[#2b1848] focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            URL / Link Channel Telegram
          </label>
          <input
            type="url"
            value={formData.channelUrl}
            onChange={(e) => setFormData({ ...formData, channelUrl: e.target.value })}
            placeholder="https://t.me/KingStreamOfficial"
            className="w-full bg-[#0D061A] border border-[#2b1848] focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Username / Handle Telegram
          </label>
          <input
            type="text"
            value={formData.channelHandle}
            onChange={(e) => setFormData({ ...formData, channelHandle: e.target.value })}
            placeholder="@KingStreamOfficial"
            className="w-full bg-[#0D061A] border border-[#2b1848] focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
          />
        </div>

        <div className="flex justify-end pt-3 border-t border-purple-900/30">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white text-xs font-bold transition shadow-lg shadow-sky-950 flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Simpan Pengaturan Telegram</span>
          </button>
        </div>
      </form>
    </div>
  );
}

