// frontend/src/App.tsx
import { useState } from 'react';
import FunctionPlots from "./components/FunctionPlot";
import GeometryBoard from "./components/GeometryBoard";
import Math3D from "./components/Math3D";
import MessageBubble from './components/MessageBubble';
import { postChat } from './api';

import { BlockMath} from 'react-katex';
import 'katex/dist/katex.min.css'; // Make sure to import the KaTeX styles


export default function App() {
  const [input, setInput] = useState('');           // User input state
  const [messages, setMessages] = useState<any[]>([]);  // Message state to store user and AI messages
  const [plotType, setPlotType] = useState('2D');    // Dropdown state to select plot type (2D, 3D, etc.)

  // Function to send the input to the backend and receive a response
  async function handleSend() {
    const data = await postChat({ message: input, plotType });
    setMessages([
      ...messages,
      { role: 'user', content: input },
      { role: 'ai', ...data, plotType }
    ]);
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
  function renderPlot(config: any, messagePlotType: string) {
    if (!config) return null;

    switch (messagePlotType) {
      case '2D':
        if (config.functions || config.implicitCurves) {
          return <FunctionPlots config={config} />;
        }
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
        ⚠️ No data found for plot type: <strong>{messagePlotType}</strong>
      </div>
    );
  }


  // Dropdown handler to change the plot type
  // function handlePlotTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
  //   setPlotType(e.target.value);
  // }

  return (
    <div>
      <header >
        <h1 >AI Math Tutor</h1>
      </header>
      <main className="content-area">
        <div >

          {messages.map((msg, i) =>
            msg.role === 'ai' ? (
              <div key={i} className="ai-response">
                <div className="ai-content">
                  {msg.explanation && (
                    <div className="ai-math">
                      <BlockMath>{msg.explanation}</BlockMath>
                    </div>
                  )}
                  <MessageBubble content={msg.markdown || msg.explanation} />
                </div>
                <div className="ai-plot">
                  {renderPlot(msg.config, msg.plotType)}
                </div>
              </div>
            ) : (
              <div key={i} className="user-question">
                <div className="user-bubble">{msg.content}</div>
              </div>
            )
          )}


        </div>

        <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="search-bar-modern">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a math question..."
            className="input-field-modern"
          />
          <div className="plot-buttons">
            <button
              type="button"
              onClick={() => setPlotType('2D')}
              className={`plot-button ${plotType === '2D' ? 'active' : ''}`}
            >
              2D
            </button>
            <button
              type="button"
              onClick={() => setPlotType('3D')}
              className={`plot-button ${plotType === '3D' ? 'active' : ''}`}
            >
              3D
            </button>
            <button
              type="button"
              onClick={() => setPlotType('Geometry')}
              className={`plot-button ${plotType === 'Geometry' ? 'active' : ''}`}
            >
              Geometry
            </button>
          </div>
          <button type="submit" className="submit-button-modern">
            Send
          </button>
        </form>

      </main>
      <footer >
        AI Tutor MVP &copy; 2025
      </footer>
    </div>
  );
}

