import { useState,useEffect, useRef } from 'react'
import MessagesList from "./components/MessagesList";
import { FaArrowUp, FaPlus } from 'react-icons/fa';
import { TbGeometry } from "react-icons/tb";
import { CiSquarePlus } from "react-icons/ci";
import { MdMenu } from "react-icons/md";
import "./index.css";

function App() {
  const[messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const[Dropdown, setDropdown] = useState(false);
  const[feature, setfeature]  =useState(null);
  const [loading, SetLoading]  = useState(false);
  const[videoUrl, setVideoUrl] = useState(null);
  
  const FEATURES = [
  { label: "2D Visual", value: 1 },
  { label: "3D Visual", value: 2 },
  { label: "2D Animation", value: 3 },
  { label: "Prepare Quiz", value: 4 },
  { label: "Video Generation", value:5}
  ];

  const send = async() => {
  if (!input.trim()) return;

  setMessages((prev) => [
    ...prev,
    { sender: "user", text: input}
  ]);

  SetLoading(true);
  setMessages((prev)=>[
    ...prev,
    { sender: "ai", type: "loading"}
  ]);

  try{
  let inp = input;
  setInput("");
  const ans = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ InPrompt: inp, ftype:feature}),
    });

  let data;
  let videoObjectUrl;
  if(feature===6){
    const blob = await ans.blob();
    videoObjectUrl = URL.createObjectURL(blob); // store in a variable
    setVideoUrl(videoObjectUrl);
  }
  else{
    data = await ans.json();
  }
     setMessages((prev) => {
        const withoutLoading = prev.filter((m) => m.type !== "loading");
        let newMsgs = [];
        if(feature===6){
          newMsgs.push({
            sender: "ai",
            type: 6,
            graph: videoObjectUrl,
          });
        }
        else{
          newMsgs.push({
            sender: "ai",
            type: data.type,
            text: "Here is the visualization of the equation :",
            graph: data.config,
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
      SetLoading(false);
      setInput("");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-container">
    <header className="chat-header">
      <MdMenu className='menu'/>
      <TbGeometry className="h-icon" /> 
      <h1 className='name' >MathVision</h1>
      <CiSquarePlus className='newchat'/>
    </header>
    
    <div className="messages">
      <MessagesList messages={messages} />
    </div>

    <div className="input-bar">
      <div className='feature-drop-wrapper'>
        <button
          className='feat-btn'
          onClick={() => setDropdown(v=>!v)}          
          tabIndex={-1}
          > <FaPlus />
        </button>
        {Dropdown && (
          <div className='feature-drop'>
            {FEATURES.map(f => (
              <div
                key={f.value}
                onClick = {() => {setfeature(f.value); setDropdown(false);}} 
                className={
                  "feature-item" + (feature === f.value ? " sel" : "")
                }>
                  {f.label}
              </div>
            ))}
          </div>
          )
        }
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask a question..."
        onKeyDown={(e) => e.key === "Enter" && send()}
      />
      <button onClick={send} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <FaArrowUp />
    </button>
    </div>
  </div>
  );
}
export default App;
 