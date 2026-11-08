/**
 * Audio Announcer for Clinic Queue System
 * Combines a clean Web Audio API hospital bell chime with natural Indonesian Text-to-Speech (TTS)
 */

// Format queue number for clear Indonesian speech pronunciation (e.g. "A-002" -> "A, kosong, kosong, dua")
export function formatSpokenQueueNumber(queueNumber: string): string {
  if (!queueNumber) return '';

  const parts = queueNumber.split('-');
  const prefix = parts[0] ? parts[0].trim() : '';
  const numbers = parts[1] ? parts[1].trim() : '';

  const digitMap: Record<string, string> = {
    '0': 'kosong',
    '1': 'satu',
    '2': 'dua',
    '3': 'tiga',
    '4': 'empat',
    '5': 'lima',
    '6': 'enam',
    '7': 'tujuh',
    '8': 'delapan',
    '9': 'sembilan',
  };

  const spokenDigits = numbers
    .split('')
    .map((d) => digitMap[d] || d)
    .join(', ');

  return `${prefix}, ${spokenDigits}`;
}

/**
 * Synthesizes a realistic, pleasant 4-tone hospital / airport bell chime
 * using native Web Audio API (100% offline, zero latency, no external mp3 needed)
 */
export function playHospitalChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        resolve();
        return;
      }

      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // 4 Pleasant Bell Chime Tones: E5 (659.25Hz), G#5 (830.61Hz), B5 (987.77Hz), E6 (1318.51Hz)
      const notes = [
        { freq: 659.25, time: 0.0, duration: 0.5 },
        { freq: 830.61, time: 0.22, duration: 0.5 },
        { freq: 987.77, time: 0.44, duration: 0.6 },
        { freq: 1318.51, time: 0.68, duration: 1.1 },
      ];

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.7, ctx.currentTime);
      masterGain.connect(ctx.destination);

      notes.forEach(({ freq, time, duration }) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        // Warm bell timbre: Sine wave with subtle harmonic
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

        // Exponential decay envelope (realistic chime hit & ring)
        const startTime = ctx.currentTime + time;
        noteGain.gain.setValueAtTime(0.0001, startTime);
        noteGain.gain.exponentialRampToValueAtTime(0.6, startTime + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.1);
      });

      // Total chime duration is ~1.8s
      setTimeout(() => {
        try {
          ctx.close();
        } catch {}
        resolve();
      }, 1600);
    } catch {
      resolve();
    }
  });
}

/**
 * Speaks an Indonesian clinic queue announcement using Web Speech API
 */
export function speakQueueAnnouncement(
  queueNumber: string,
  patientName: string,
  roomName: string = 'Ruang Pemeriksaan Dokter'
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      const spokenNumber = formatSpokenQueueNumber(queueNumber);
      const text = `Nomor antrian... ${spokenNumber}... Pasien... ${patientName}... Silakan menuju ke ${roomName}.`;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 0.92; // Clear, dignified announcement tempo
      utterance.pitch = 1.02;
      utterance.volume = 1.0;

      // Find an Indonesian voice if available
      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(
        (v) => v.lang.startsWith('id') || v.lang.includes('ID') || v.name.toLowerCase().includes('indonesia')
      );
      if (idVoice) {
        utterance.voice = idVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      // Safari/Chrome fallback timeout in case onend never fires
      setTimeout(() => resolve(), 8000);

      window.speechSynthesis.speak(utterance);
    } catch {
      resolve();
    }
  });
}

/**
 * Broadcasts call event to other browser tabs/windows (e.g. Queue TV Display)
 */
export function broadcastQueueCall(
  queueNumber: string,
  patientName: string,
  roomName: string = 'Ruang Pemeriksaan Dokter'
) {
  if (typeof window !== 'undefined') {
    const payload = {
      queueNumber,
      patientName,
      roomName,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem('rme_broadcast_queue_call', JSON.stringify(payload));
    } catch (e) {
      console.warn('Storage broadcast error:', e);
    }
  }
}

/**
 * Main queue calling function:
 * Plays the chime first, then speaks the queue announcement in Indonesian.
 */
export async function callQueuePatient(
  queueNumber: string,
  patientName: string,
  roomName: string = 'Ruang Pemeriksaan Dokter'
): Promise<void> {
  // Broadcast to other screens (e.g. TV display)
  broadcastQueueCall(queueNumber, patientName, roomName);

  try {
    // 1. Play hospital bell chime
    await playHospitalChime();

    // 2. Small pleasant pause (200ms) then speak announcement
    await new Promise((r) => setTimeout(r, 200));
    await speakQueueAnnouncement(queueNumber, patientName, roomName);
  } catch (err) {
    console.warn('Queue audio call error:', err);
  }
}

