// frontend/src/App.tsx
import { useState } from 'react';
import FunctionPlots from "./components/FunctionPlot";
import GeometryBoard from "./components/GeometryBoard";
import Math3D from "./components/Math3D";
import MessageBubble from './components/MessageBubble';

import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css'; // Make sure to import the KaTeX styles


export default function App() {
  const [input, setInput] = useState('');           // User input state
  const [messages, setMessages] = useState<any[]>([]);  // Message state to store user and AI messages
  const [plotType, setPlotType] = useState('2D');    // Dropdown state to select plot type (2D, 3D, etc.)

  // Function to send the input to the backend and receive a response
  async function handleSend() {
    const res = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input, plotType }),
    });
    const data = await res.json();
    setMessages([...messages, { role: 'user', content: input }, { role: 'ai', ...data }]);
    speak(data.plaintext);  // Speech output of AI's response
    setInput('');
  }

  // Speech synthesis function to read out the AI's answer
  function speak(text: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
  }

  // Function to render different plot components based on the configuration received
  function renderPlot(config: any) {
    if (!config) return null;

    switch (plotType) {
      case '2D':
        if (config.functions) return <FunctionPlots config={config} />;
        break;
      case 'Geometry':
        if (config.points || config.circles || config.segments)
          return <GeometryBoard config={config} />;
        break;
      case '3D':
        if (config.surfaces || config.curves) return <Math3D config={config} />;
        else {
          return (
            <div className="text-white text-sm text-center">
              ❌ Cannot plot 3D graph. Try rephrasing your question like: <br />
              <code>"Plot a 3D sphere with radius 5"</code>
            </div>
          );
        }
      default:
        return null;
    }

    return (
      <div className="text-gray-400 text-sm text-center">
        ⚠️ No data found for selected plot type: <strong>{plotType}</strong>
      </div>
    );
  }

  // Dropdown handler to change the plot type
  function handlePlotTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setPlotType(e.target.value);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#343541] to-[#444654] flex flex-col">
      <header className="w-full py-4 px-6 border-b border-[#343541] bg-[#343541]/80 backdrop-blur-lg shadow">
        <h1 className="text-3xl font-bold text-white text-center tracking-tight">AI Math Tutor</h1>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-2 md:px-0">
        <div className="w-full max-w-4xl mx-auto flex flex-col space-y-6 mt-8 mb-4">
          {messages.map((msg, i) =>
            msg.role === 'ai' ? (
              <div key={i} className="flex flex-row gap-6 justify-center items-start bg-[#23232b]/80 rounded-2xl shadow-lg p-6">
                {/* Left: Explanation */}
                <div className="flex-1 max-w-[50%] pr-4">
                  <MessageBubble content={msg.explanation || msg.markdown} />
                  
                  {/* Render LaTeX with BlockMath */}
                  {msg.explanation && (
                    <div className="mt-4">
                      {/* Render LaTeX properly */}
                      <BlockMath>{msg.explanation}</BlockMath>
                    </div>
                  )}
                </div>
                {/* Right: Plot/Visual with pitch black background */}
                <div className="flex-1 max-w-[50%] flex justify-center items-center bg-black rounded-xl min-h-[350px]">
                  {renderPlot(msg.config)} {/* Dynamically render plots */}
                </div>
              </div>
            ) : (
              <div key={i} className="text-right text-white my-2">{msg.content}</div>
            )
          )}
        </div>
        <form onSubmit={e => { e.preventDefault(); handleSend(); }} className=" mx-auto flex gap-3 mt-8 items-center justify-center rounded-xl shadow p-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a math question..."
            className="input-field"
          />
          <button type="submit" className="submit-button">
            Send
          </button>
          {/* Dropdown for selecting plot type */}
          <select onChange={handlePlotTypeChange} value={plotType} className="bg-[#343541] text-white p-2 rounded-md">
            <option value="2D">2D Plot</option>
            <option value="3D">3D Plot</option>
            <option value="Geometry">Geometry</option>
          </select>
        </form>
      </main>
      <footer className="w-full py-3 text-center text-xs text-[#b4bcd0] bg-[#343541]/80 border-t border-[#343541]">
        AI Tutor MVP &copy; 2025
      </footer>
    </div>
  );
}



// import FunctionPlots from "./components/FunctionPlot";
// import GeometryBoard from "./components/GeometryBoard";
// import Math3D from "./components/Math3D";
// import { useState } from 'react';
// import MessageBubble from './components/MessageBubble.tsx';

// export default function App() {
//   const [input, setInput] = useState('');
//   const [messages, setMessages] = useState<any[]>([]);

//   async function handleSend() {
//     const res = await fetch('http://localhost:3001/api/chat', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ message: input }),
//     });
//     const data = await res.json();
//     setMessages([...messages, { role: 'user', content: input }, { role: 'ai', ...data }]);
//     speak(data.plaintext);
//     setInput('');
//   }

//   function speak(text: string) {
//     const utterance = new SpeechSynthesisUtterance(text);
//     utterance.lang = 'en-US';
//     speechSynthesis.speak(utterance);
//   }

//   function renderPlot(config: any) {
//     if (!config) return null;
//     if (config.functions) return <FunctionPlots config={config} />;
//     if (config.points) return <GeometryBoard config={config} />;
//     if (config.surfaces || config.curves) return <Math3D config={config} />;
//     return null;
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-[#343541] to-[#444654] flex flex-col">
//       <header className="w-full py-4 px-6 border-b border-[#343541] bg-[#343541]/80 backdrop-blur-lg shadow">
//         <h1 className="text-3xl font-bold text-white text-center tracking-tight">AI Math Tutor</h1>
//       </header>
//       <main className="flex-1 flex flex-col items-center justify-center px-2 md:px-0">
//         <div className="w-full max-w-4xl mx-auto flex flex-col space-y-6 mt-8 mb-4">
//           {messages.map((msg, i) =>
//             msg.role === 'ai' ? (
//               <div key={i} className="flex flex-row gap-6 justify-center items-start bg-[#23232b]/80 rounded-2xl shadow-lg p-6">
//                 {/* Left: Explanation */}
//                 <div className="flex-1 max-w-[50%] pr-4">
//                   <MessageBubble content={msg.explanation || msg.markdown} />
//                 </div>
//                 {/* Right: Plot/Visual with pitch black background */}
//                 <div
//                   className="flex-1 max-w-[50%] flex justify-center items-center bg-black rounded-xl min-h-[350px]"
//                 >
//                   {renderPlot(msg.config)}
//                 </div>
//               </div>
//             ) : (
//               <div key={i} className="text-right text-white my-2">{msg.content}</div>
//             )
//           )}
//         </div>
//         <form onSubmit={e => { e.preventDefault(); handleSend(); }} className=" mx-auto flex gap-3 mt-8 items-center justify-center  rounded-xl shadow p-4">
//           <input
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             placeholder="Ask a math question..."
//             className="input-field"
//           />
//           <button
//             type="submit"
//             className="submit-button"
//           >
//             Send
//           </button>
//         </form>
//       </main>
//       <footer className="w-full py-3 text-center text-xs text-[#b4bcd0] bg-[#343541]/80 border-t border-[#343541]">AI Tutor MVP &copy; 2025</footer>
//     </div>
//   );
// }
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// import FunctionPlots from "./components/FunctionPlot";
// import GeometryBoard from "./components/GeometryBoard";
// import Math3D from "./components/Math3D";

// // Main application component for the AI Math Tutor
// import { useState } from 'react';
// import MessageBubble from './components/MessageBubble.tsx';
// import Plot from './components/Plot.tsx';



// export default function App() {
//   const [input, setInput] = useState('');
//   const [messages, setMessages] = useState<any[]>([]);

//   async function handleSend() {
//     const res = await fetch('http://localhost:3001/api/chat', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ message: input }),
//     });
//     const data = await res.json();
//     setMessages([...messages, { role: 'user', content: input }, { role: 'ai', ...data }]);
//     speak(data.plaintext);
//     setInput('');
//   }

//   function speak(text: string) {
//     const utterance = new SpeechSynthesisUtterance(text);
//     utterance.lang = 'en-US';
//     speechSynthesis.speak(utterance);
//   }


//   // ...existing code...
//   return (
//     <div>
//       <header >
//         <h1 className="text-2xl md:text-3xl font-bold text-white text-center">AI Math Tutor</h1>
//       </header>
//       <main>
//   <div>
//     {messages.map((msg, i) =>
//       msg.role === 'ai' ? (
//         <div key={i}>
//           <MessageBubble content={ msg } />
//           {/* Render visuals if config exists */}
//           {msg.config && (
//             <>
//               {/* Render based on config structure */}
//               {<FunctionPlots config={msg.config} />} 
//               {msg.config.points && <GeometryBoard config={msg.config} />}
//               {(msg.config.surfaces || msg.config.curves) && <Math3D config={msg.config} />}
//             </>
//           )}
//         </div>
//       ) : (
//         <div key={i} className="text-right text-white">{msg.content}</div>
//       )
//     )}
//   </div>
// </main>
      
//         <form  onSubmit={e => { e.preventDefault(); handleSend(); }}>
//           <input
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             placeholder="Ask a math question..."
//             className="text-2xl md:text-3xl font-bold text-white text-center"
//           />
//           <button
//             type="submit"
//             className="text-2xl md:text-3xl font-bold text-white text-center"
//           >
//             Send
//           </button>
//         </form>
  
//       <footer >AI Tutor MVP &copy; 2025</footer>
//     </div >
//   );
//   // ...existing code...
// }