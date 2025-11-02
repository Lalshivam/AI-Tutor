// VoiceInput.tsx
import { useEffect, useRef, useState } from 'react';

type Props = {
  onResult: (text: string) => void;
  onInterim?: (text: string) => void;
  getInputSnapshot?: () => string;
  lang?: string;
  continuous?: boolean;
};

export default function VoiceInput({
  onResult,
  onInterim,
  getInputSnapshot,
  lang = 'en-US',
  continuous = true
}: Props) {
  const [listening, setListening] = useState(false);
  const [interimLocal, setInterimLocal] = useState('');
  const recognitionRef = useRef<any>(null);
  const manualStopRef = useRef(false);
  const baseTextRef = useRef('');

  // Keep latest callbacks without causing effect re-creation
  const onInterimRef = useRef(onInterim);
  const onResultRef = useRef(onResult);
  useEffect(() => { onInterimRef.current = onInterim; }, [onInterim]);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      console.warn('SpeechRecognition not supported in this browser.');
      recognitionRef.current = null;
      return;
    }
    const r = new SR();
    r.lang = lang;
    r.interimResults = true;
    r.continuous = continuous;

    r.onstart = () => {
      // console.log('SR started');
    };

    r.onresult = (ev: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = 0; i < ev.results.length; i++) {
        const res = ev.results[i];
        if (res.isFinal) finalTranscript += res[0].transcript;
        else interimTranscript += res[0].transcript;
      }

      if (interimTranscript) {
        setInterimLocal(interimTranscript);
        const full = (baseTextRef.current ? baseTextRef.current + ' ' : '') + interimTranscript.trim();
        onInterimRef.current?.(full);
      } else {
        setInterimLocal('');
      }

      if (finalTranscript) {
        const finalFull = (baseTextRef.current ? baseTextRef.current + ' ' : '') + finalTranscript.trim();
        onResultRef.current?.(finalFull);
        setInterimLocal('');
        // keep listening; do not stop here
      }
    };

    r.onerror = (e: any) => {
      console.warn('SpeechRecognition error', e);
      setListening(false);
    };

    r.onend = () => {
      // Restart if user didn't press stop and continuous is desired
      if (!manualStopRef.current && continuous) {
        setTimeout(() => {
          try { r.start(); setListening(true); } catch { setListening(false); }
        }, 150);
      } else {
        setListening(false);
      }
    };

    recognitionRef.current = r;
    return () => {
      try { r.stop(); } catch {}
      recognitionRef.current = null;
    };
  }, [lang, continuous]); // NOTE: no deps on onInterim/onResult

  const start = () => {
    const r = recognitionRef.current;
    if (!r) {
      alert('SpeechRecognition not supported in this browser.');
      return;
    }
    manualStopRef.current = false;
    baseTextRef.current = getInputSnapshot?.() || '';
    try { r.start(); setListening(true); } catch (e) { /* already started */ }
  };

  const stop = () => {
    manualStopRef.current = true;
    const r = recognitionRef.current;
    try { r?.stop(); } catch {}
    setListening(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); listening ? stop() : start(); }}
        onMouseDown={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
        }}
        aria-pressed={listening}
        title={listening ? 'Stop recording' : 'Start voice input'}
        style={{
          width: 40, height: 40, borderRadius: 20,
          background: listening ? '#d33' : '#444', color: '#fff', border: 'none', cursor: 'pointer'
        }}
      >
        {listening ? '■' : '🎙'}
      </button>
      <div style={{ color: '#99a', fontSize: 13 }}>
        {interimLocal || (listening ? 'Listening…' : '')}
      </div>
    </div>
  );
}