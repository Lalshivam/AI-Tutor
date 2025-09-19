import { useState,useEffect, useRef } from 'react'
import MessagesList from "./components/MessagesList";
import "./index.css";

function App() {
  const[messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const [loading, SetLoading]  = useState(false);

  const send = async() => {
  if (!input.trim()) return;

  let type = input.includes("Math") ? "composite" : "normal";

  setMessages((prev) => [
    ...prev,
    { sender: "user", text: input, type: "normal" }
  ]);

  SetLoading(true);
  setMessages((prev)=>[
    ...prev,
    { sender: "ai", type: "loading"}
  ]);

  try {
  const ans = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ InPrompt: input, Pnum: 3}),
    });

  const data = await ans.json();
      setMessages((prev) => {
        // remove the "loading" placeholder
        const withoutLoading = prev.filter((m) => m.type !== "loading");

        let newMsgs = [];
        if (type === "composite") {
          newMsgs.push({
            sender: "ai",
            type: "composite",
            text: "Here is the visualization of the equation :",
            graph: data,
            exp: data.explanation
          });
        } else {
          newMsgs.push({
            sender: "ai",
            type: "normal",
            exp: data.explanation
          }); 
        }
        return [...withoutLoading, ...newMsgs];
      });
    } catch (err) {
      console.error("Error:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", type: "error", text: "⚠️ Something went wrong." }
      ]);
    } finally {
      SetLoading(false); // reset loading
      setInput("");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-container">
    <header className="chat-header">
      <h1>MathVision</h1>
    </header>

    <div className="messages">
      <MessagesList messages={messages} />
    </div>

    <div className="input-bar">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask a question..."
        onKeyDown={(e) => e.key === "Enter" && send()}
      />
      <button onClick={send}>Send</button>
    </div>
  </div>
  );
}
export default App;