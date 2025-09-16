import { useState,useEffect, useRef } from 'react'
import MessagesList from "./components/MessagesList";
import "./index.css";

function App() {
  const[messages, setMessages] = useState([
    {sender:"ai" , text: "Hi! I'm your AI math tutor.", type:"text"},]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const send = async() => {
  if (!input.trim()) return;

  let type = input.includes("Math") ? "graph" : "text";

  setMessages((prev) => [
    ...prev,
    { sender: "user", text: input, type: "text" }
  ]);

  const ans = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ InPrompt: input, Pnum: 3}),
    });
  
    const data = await ans.json();
  
  setMessages((prev) => {
    let newMsgs = []
    if(type==="graph"){
      newMsgs.push(
        {sender: "ai", text:"Here is the visualization of the equation :", type:"text"},
        {sender: "ai", text:data.config, type}
      )
    }
      newMsgs.push({sender: "ai", text:data.explanation, type:"text"})
    return [...prev,...newMsgs]
  })

  setInput("");
  }; 


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="messages">
      <MessagesList messages={messages}/>
      <div className="input-bar">
        <input
          type="text"
          value={input}
          onChange ={(e)=>setInput(e.target.value)}
          placeholder="Ask a question..."
          onKeyDown={(e)=>e.key === "Enter" && send()}
        />
      <button onClick={send}>Send</button>
      </div>
    </div>
  );
}
export default App;