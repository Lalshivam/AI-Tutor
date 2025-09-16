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
    <div>
      <header >
        <h1 className="text-2xl md:text-3xl font-bold text-white text-center">AI Math Tutor</h1>
      </header>
      <main >
        <div >
          {/* Message list */}
          {messages.map((msg, i) =>
            msg.role === 'ai' ? (
              <MessageBubble key={i} content={msg.markdown} />
            ) : (
              <div key={i} >
                <div >{msg.content}</div>
              </div>
            )
          )}
        </div>
        <form  onSubmit={e => { e.preventDefault(); handleSend(); }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a math question..."
            className="text-2xl md:text-3xl font-bold text-white text-center"
          />
          <button
            type="submit"
            className="text-2xl md:text-3xl font-bold text-white text-center"
          >
            Send
          </button>
        </form>
      </main>
      <footer >AI Tutor MVP &copy; 2025</footer>
    </div>
  );
  // ...existing code...
}