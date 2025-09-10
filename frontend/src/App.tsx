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

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI Math Tutor</h1>
      <div className="space-y-4">
        {messages.map((msg, i) =>
          msg.role === 'ai' ? (
            <MessageBubble key={i} content={msg.markdown} />
          ) : (
            <div key={i} className="text-right">{msg.content}</div>
          )
        )}
      </div>
      <div className="mt-6 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border p-2 rounded"
          placeholder="Ask a math question..."
        />
        <button onClick={handleSend} className="bg-blue-600 text-white px-4 py-2 rounded">
          Send
        </button>
      </div>
    </div>
  );
}
