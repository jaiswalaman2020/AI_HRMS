import { useEffect, useRef, useState } from 'react';

/**
 * Thin wrapper over the browser Web Speech API.
 *  - speech-to-text via SpeechRecognition (Chrome/Edge/Safari)
 *  - text-to-speech via speechSynthesis
 * Gracefully reports `supported: false` where unavailable.
 */
export function useSpeech({ onResult } = {}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map((r) => r[0].transcript).join(' ');
      onResult?.(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    return () => rec.abort?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = () => {
    if (!recognitionRef.current || listening) return;
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch {
      /* already started */
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const speak = (text) => {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  };

  const stopSpeaking = () => window.speechSynthesis?.cancel();

  return { listening, supported, startListening, stopListening, speak, stopSpeaking };
}
