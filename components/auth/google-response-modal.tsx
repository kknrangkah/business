'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRME } from '@/context/rme-context';
import { toast } from 'sonner';
import { KeyRound, Clipboard, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

interface GoogleResponseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GoogleResponseModal({ open, onOpenChange }: GoogleResponseModalProps) {
  const router = useRouter();
  const { loginWithGoogleResponse } = useRME();
  const [jsonInput, setJsonInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcessResponse = async (textToProcess?: string) => {
    const rawText = (textToProcess || jsonInput).trim();
    if (!rawText) {
      setError('Harap masukkan atau tempelkan teks response JSON.');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      let parsedData: any = null;

      // Check if it is a JSON object string
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else if (rawText.startsWith('ey') && rawText.includes('.')) {
        // Direct JWT token string
        parsedData = {
          response_code: 200,
          response_message: 'Berhasil',
          responseResult: true,
          data: {
            token: rawText,
            access_token: rawText,
          },
        };
      } else {
        throw new Error('Format teks tidak valid. Pastikan teks berisi format JSON { ... } atau token JWT.');
      }

      const res = await loginWithGoogleResponse(parsedData);
      if (res.success && res.user) {
        toast.success(`Selamat datang, ${res.user.name}!`, {
          description: `Login berhasil (${res.user.email}). Mengarahkan ke Dashboard...`,
        });
        onOpenChange(false);
        router.replace('/dashboard');
      } else {
        setError(res.error || 'Gagal memproses data otentikasi dari JSON response.');
        toast.error(res.error || 'Gagal memproses data otentikasi.');
      }
    } catch (err: any) {
      console.error('[GoogleResponseModal] Error parsing:', err);
      setError(err.message || 'Gagal membaca format JSON. Pastikan seluruh teks ter-copy dengan lengkap.');
      toast.error('Format JSON tidak valid.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setJsonInput(text);
          toast.info('Teks berhasil ditempel dari clipboard!');
          handleProcessResponse(text);
          return;
        }
      }
      toast.error('Clipboard kosong atau izin akses tidak diberikan.');
    } catch {
      toast.error('Gagal mengakses clipboard. Silakan gunakan Ctrl+V pada kotak isian.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="lg">
      <div className="space-y-4 text-slate-900">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0 mt-0.5">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Selesaikan Login dari Respon Google</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Jika browser menampilkan teks respon JSON di jendela popup, tempelkan di sini untuk langsung masuk.
            </p>
          </div>
        </div>

        {/* Quick Paste helper */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium">
            <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Sudah salin teks JSON dari popup?</span>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handlePasteClipboard}
            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg px-3 flex items-center gap-1.5 shadow-sm"
          >
            <Clipboard className="h-3.5 w-3.5" />
            Tempel dari Clipboard
          </Button>
        </div>

        {/* Textarea */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">Teks Respon JSON / Token JWT:</label>
          <textarea
            rows={5}
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value);
              setError(null);
            }}
            placeholder='Tempel respon di sini, contoh: {"response_code":200,"response_message":"Berhasil","data":{"token":"..."}}'
            className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-slate-50 resize-none text-slate-800"
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs rounded-xl"
            disabled={isProcessing}
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => handleProcessResponse()}
            disabled={isProcessing || !jsonInput.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl px-4 flex items-center gap-1.5"
          >
            {isProcessing ? 'Memproses...' : 'Buka Dashboard'}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
