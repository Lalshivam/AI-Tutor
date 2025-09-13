// frontend/src/App.tsx
// Main application component for the AI Math Tutor
import { useState } from 'react';
import MessageBubble from './components/MessageBubble.tsx';
import Plot from './components/Plot.tsx';

export default function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);

  async function handleSend() {
    const res = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input }),
    });
    const data = await res.json();
    setMessages([...messages, { role: 'user', content: input }, { role: 'ai', ...data }]);
    speak(data.plaintext);
    setInput('');
  }

  function speak(text: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
  }


  // ...existing code...
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#343541] to-[#444654] flex flex-col">
      <header className="w-full py-4 px-6 border-b border-[#343541] bg-[#343541]/80 backdrop-blur-lg">
        <h1 className="text-2xl md:text-3xl font-bold text-white text-center">AI Math Tutor</h1>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-2 md:px-0">
        <div className="w-full max-w-3xl mx-auto flex flex-col h-[70vh] md:h-[60vh] bg-[#212121]/80 rounded-2xl shadow-2xl p-6 md:p-12 overflow-y-auto space-y-6 mt-12 items-center justify-center">
          {/* Message list */}
          {messages.map((msg, i) =>
            msg.role === 'ai' ? (
              <MessageBubble key={i} content={msg.markdown} />
            ) : (
              <div key={i} className="text-right text-white w-full flex justify-end">
                <div className="bg-[#343541] px-5 py-3 rounded-2xl max-w-[80%]">{msg.content}</div>
              </div>
            )
          )}
        </div>
        <form className="w-full max-w-3xl mx-auto flex gap-3 mt-8 items-center justify-center" onSubmit={e => { e.preventDefault(); handleSend(); }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-[#40414f] text-white border-none p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#19c37d] placeholder:text-[#b4bcd0] text-lg"
            placeholder="Ask a math question..."
          />
          <button
            type="submit"
            className="bg-[#19c37d] hover:bg-[#15a06a] text-white px-8 py-4 rounded-xl font-semibold transition shadow text-lg"
          >
            Send
          </button>
        </form>
      </main>
      <footer className="w-full py-3 text-center text-xs text-[#b4bcd0] bg-[#343541]/80 border-t border-[#343541]">AI Tutor MVP &copy; 2025</footer>
    </div>
  );
  // ...existing code...
}