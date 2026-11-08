'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ChevronDown,
  RotateCcw,
  Stethoscope,
  Pill,
  FileText,
  Clock,
  HelpCircle,
  Minimize2,
  Maximize2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRME } from '@/context/rme-context';
import { cn, formatRupiah } from '@/lib/utils';

interface ChatMessage {
  id: string;
  sender: 'BOT' | 'USER';
  text: string;
  timestamp: string;
  suggestions?: string[];
  actionLink?: {
    label: string;
    href: string;
  };
}

export function ClinicalChatBot() {
  const { patients, visits, medications, diagnoses, config, currentUser } = useRME();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userName = currentUser?.name || (config.currentRole === 'DOCTOR' ? config.doctorName : 'Petugas Faskes');
  const activeVisit = visits.find((v) => v.status === 'IN_PROGRESS') || visits.find((v) => v.status === 'WAITING' || v.status === 'REGISTERED') || visits[0];
  const examHref = activeVisit ? `/examination/${activeVisit.id}` : '/queue';

  // Initial welcome message
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'BOT',
      text: `Halo ${userName}! 👋 \n\nSaya **Asisten AI Klinis RME Klinik**. Saya dapat membantu Anda mencari **kode ICD-10**, **rekomendasi dosis obat**, **status antrian pasien**, atau panduan operasional sistem.`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        '🔍 Cari kode ICD-10 ISPA & Hipertensi',
        '📊 Berapa pasien dalam antrian hari ini?',
        '💊 Cek stok & harga Paracetamol',
        '💡 Bagaimana cara proses pembayaran kasir?',
      ],
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  // AI response engine with clinical & system context
  const generateAIResponse = (query: string): { text: string; actionLink?: { label: string; href: string } } => {
    const q = query.toLowerCase();

    // 1. Queue / Antrian questions
    if (q.includes('antrian') || q.includes('pasien hari ini') || q.includes('antri')) {
      const waiting = visits.filter((v) => v.status === 'WAITING' || v.status === 'IN_PROGRESS').length;
      const waitingPayment = visits.filter((v) => v.status === 'WAITING_PAYMENT').length;
      const completed = visits.filter((v) => v.status === 'COMPLETED' || v.status === 'PAID').length;

      return {
        text: `📋 **Status Antrian Hari Ini:**\n\n- ⏳ Pasien Menunggu / Diperiksa: **${waiting} pasien**\n- 💳 Menunggu Kasir/Billing: **${waitingPayment} pasien**\n- ✅ Kunjungan Selesai: **${completed} pasien**\n- 👥 Total Pasien Terdaftar di Database: **${patients.length} orang**`,
        actionLink: { label: 'Buka Layar Antrian', href: '/queue' },
      };
    }

    // 2. ICD-10 Diagnosis Search
    if (q.includes('icd') || q.includes('diagnosis') || q.includes('penyakit') || q.includes('ispa') || q.includes('hipertensi') || q.includes('diabetes') || q.includes('gastritis')) {
      const matched = diagnoses.filter((d) =>
        d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q) || q.includes(d.name.toLowerCase().slice(0, 4))
      );

      if (matched.length > 0) {
        let list = matched
          .slice(0, 4)
          .map((d) => `• **${d.code}** — ${d.name} *(${d.category || 'Klinis'})*`)
          .join('\n');
        return {
          text: `🔍 **Hasil Referensi ICD-10 Terkait:**\n\n${list}\n\n*Tips: Anda dapat langsung memilih kode ini di form Pemeriksaan Pasien 3-Kolom.*`,
          actionLink: { label: 'Ke Form Pemeriksaan', href: examHref },
        };
      }

      return {
        text: `🔍 **Daftar Diagnosis ICD-10 Populer Faskes Primer:**\n\n• **J06.9** — ISPA Akut (Infeksi Saluran Pernapasan Atas)\n• **I10** — Hipertensi Esensial (Primer)\n• **E11.9** — Diabetes Melitus Tipe 2\n• **K29.7** — Gastritis / Dispepsia\n• **M79.1** — Myalgia (Nyeri Otot)\n• **L30.9** — Dermatitis / Alergi Kulit`,
      };
    }

    // 3. Medication / Obat Search
    if (q.includes('obat') || q.includes('stok') || q.includes('harga') || q.includes('paracetamol') || q.includes('amoxicillin') || q.includes('dosis') || q.includes('resep')) {
      const matchedMeds = medications.filter(
        (m) => q.includes(m.name.toLowerCase()) || q.includes(m.genericName?.toLowerCase() || '') || m.name.toLowerCase().includes(q)
      );

      if (matchedMeds.length > 0) {
        const m = matchedMeds[0];
        return {
          text: `💊 **Informasi Obat: ${m.name}**\n\n- **Kandungan:** ${m.genericName || m.name} ${m.dosage}\n- **Sediaan:** ${m.unit}\n- **Tarif:** ${formatRupiah(m.price)}\n- **Stok Tersedia:** ${m.stock} ${m.unit}\n- **Signa Standar:** *${m.standardSigna}*\n\n⚠️ *Selalu pastikan memeriksa riwayat alergi obat pasien sebelum meresepkan.*`,
          actionLink: { label: 'Lihat Katalog Obat', href: '/medications' },
        };
      }

      return {
        text: `💊 **Katalog Obat Klinik:**\n\nSaat ini terdapat **${medications.length} item obat** terdaftar di master data klinik, termasuk analgesik, antibiotik, antihipertensi, dan vitamin. Anda dapat menambah atau mengedit stok melalui menu Katalog Resep Obat.`,
        actionLink: { label: 'Buka Katalog Obat', href: '/medications' },
      };
    }

    // 4. Billing & Kasir Guidance
    if (q.includes('bayar') || q.includes('kasir') || q.includes('billing') || q.includes('tagihan') || q.includes('kwitansi')) {
      return {
        text: `💳 **Alur Pembayaran & Kasir RME:**\n\n1. Kunjungan yang telah selesai diperiksa dokter akan otomatis masuk status **Menunggu Pembayaran**.\n2. Buka menu **Tagihan & Kasir** (` + '`/billing`' + `) atau tombol kasir pada antrian.\n3. Pilih metode pembayaran: **Tunai** *(dengan kalkulator kembalian otomatis)*, **QRIS Dinamis**, atau **Transfer Bank**.\n4. Klik **Proses Pembayaran & Cetak Kwitansi Resmi** ber-Kop Klinik & SIP.`,
        actionLink: { label: 'Buka Menu Kasir', href: '/billing' },
      };
    }

    // 5. Pendaftaran & Wilayah Pasien
    if (q.includes('daftar') || q.includes('pasien baru') || q.includes('alamat') || q.includes('nik') || q.includes('wilayah')) {
      return {
        text: `📝 **Pendaftaran Pasien Baru:**\n\n- NIK (16 digit) bersifat **wajib diisi** untuk ketunggalan data rekam medis.\n- Alamat menggunakan format wilayah berjenjang Indonesia: **Provinsi $\\rightarrow$ Kota/Kabupaten $\\rightarrow$ Kecamatan $\\rightarrow$ Kelurahan $\\rightarrow$ RT/RW & Jalan**.\n- Nomor Rekam Medis (No RM) dan Nomor Antrian (contoh: ` + '`A-001`' + `) diterbitkan otomatis oleh sistem.`,
        actionLink: { label: 'Buka Pendaftaran Pasien', href: '/registration' },
      };
    }

    // 6. Mode 1 vs Mode 2
    if (q.includes('mode') || q.includes('role') || q.includes('dokter saja') || q.includes('admin')) {
      return {
        text: `⚙️ **Skenario Mode Aplikasi RME:**\n\n• **Mode 1 (Dokter Saja):** Seluruh proses dari pendaftaran, antrian, pemeriksaan klinis, billing, hingga kasir dilakukan sendiri oleh dokter dalam satu antarmuka.\n• **Mode 2 (Dokter + Admin):** Pemisahan hak akses: Admin fokus pada pendaftaran/antrian/kasir *(catatan medis read-only)* dan Dokter fokus pada rekam medis klinis.\n\n*Anda dapat beralih mode dan role kapan saja melalui tombol selector di header atas.*`,
        actionLink: { label: 'Pengaturan Mode', href: '/settings?tab=operational' },
      };
    }

    // General default helpful response
    return {
      text: `Saya mengerti pertanyaan Anda mengenai **"${query}"**.\n\nSebagai Asisten Klinis RME, saya dapat memberikan informasi seputar:\n- 🩺 Pencarian Kode ICD-10 & Tindakan Medis\n- 💊 Cek Stok Obat & Rekomendasi Dosis\n- 📋 Pembuatan Kunjungan & Status Antrian\n- 💳 Proses Kasir & Cetak Kwitansi Resmi\n- 📑 Arsip Rekam Medis Elektronik\n\nSilakan pilih salah satu topik atau ajukan pertanyaan spesifik lainnya!`,
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const messageText = (textToSend || inputMessage).trim();
    if (!messageText) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'USER',
      text: messageText,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI thinking and response
    setTimeout(() => {
      const response = generateAIResponse(messageText);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'BOT',
        text: response.text,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        actionLink: response.actionLink,
        suggestions: [
          '🩺 Cari ICD-10 lain',
          '📊 Cek antrian pasien',
          '💊 Cek stok obat klinik',
        ],
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        sender: 'BOT',
        text: `Percakapan telah di-reset. Ada hal klinis atau data pasien yang bisa saya bantu sekarang?`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          '🔍 Cari kode ICD-10',
          '📊 Status antrian hari ini',
          '💊 Katalog obat klinik',
        ],
      },
    ]);
  };

  return (
    <>
      {/* Floating Mini Trigger Button (Bottom Right - Compact 40px Design) */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 z-40 group">
          <button
            onClick={() => setIsOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-green-500 hover:from-emerald-700 hover:to-teal-600 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-white/80"
            aria-label="Buka Asisten AI Klinis"
          >
            <div className="relative flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
            </div>
          </button>

          {/* Minimal Floating Tooltip on Hover */}
          <div className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-2 hidden rounded-md bg-slate-900/90 backdrop-blur-xs px-2 py-1 text-[11px] font-medium text-white shadow-md group-hover:block z-50 whitespace-nowrap animate-in fade-in zoom-in-95">
            Asisten AI Klinis
          </div>
        </div>
      )}

      {/* Interactive Chat Window */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[520px] w-96 max-w-[calc(100vw-2.5rem)] flex-col rounded-2xl border border-slate-200/90 bg-white shadow-2xl animate-in slide-in-from-bottom-5 duration-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-emerald-500/20 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 px-4 py-3 text-white shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold leading-tight">Asisten AI RME Praktik</span>
                <span className="text-[10px] text-emerald-100 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  Online • Siap Membantu
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Reset Percakapan"
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Tutup Chat"
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex flex-col gap-1 max-w-[85%]',
                  msg.sender === 'USER' ? 'ml-auto items-end' : 'mr-auto items-start'
                )}
              >
                <div
                  className={cn(
                    'rounded-2xl px-3.5 py-2.5 shadow-2xs leading-relaxed whitespace-pre-wrap',
                    msg.sender === 'USER'
                      ? 'bg-emerald-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                  )}
                >
                  {msg.text}

                  {/* Optional Action Link */}
                  {msg.actionLink && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <a
                        href={msg.actionLink.href}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 hover:bg-emerald-100 transition-colors"
                      >
                        <span>{msg.actionLink.label}</span>
                        <span>→</span>
                      </a>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-slate-400 px-1 font-mono">{msg.timestamp}</span>

                {/* Quick Suggestion Chips */}
                {msg.suggestions && msg.suggestions.length > 0 && msg.sender === 'BOT' && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(s)}
                        className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all shadow-2xs cursor-pointer text-left"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-1.5 rounded-2xl bg-white border border-slate-200/80 px-3 py-2 text-slate-400 w-fit shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-slate-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ketik pertanyaan klinis / antrian / obat..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
