// frontend/src/App.tsx
import { useState, useCallback, useEffect } from 'react';
// import FunctionPlots from './components/FunctionPlot';
// import GeometryBoard from './components/GeometryBoard';
import PlotBoard from './components/PlotBoard';
import Math3D from './components/Math3D';
import MessageBubble from './components/MessageBubble';
import VoiceInput from './components/VoiceInput';
import { postChat } from './api';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

// type PlotType = '2D' | '3D' | 'Geometry';
type PlotType = '2D' | '3D'; // merged Geometry into 2D

export default function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [plotType, setPlotType] = useState<PlotType>('2D');
  const [loading, setLoading] = useState(false);
  const [canUseVoice, setCanUseVoice] = useState(false);

  useEffect(() => {
    const w = window as any;
    const speechSupported = !!(w.SpeechRecognition || w.webkitSpeechRecognition);
    const ua = navigator.userAgent;
    const isChromeUA = /Chrome/i.test(ua) && !/Edg|OPR|Opera|Brave/i.test(ua);
    const isChromeBrands =
      (navigator as any).userAgentData?.brands?.some((b: any) => /Google Chrome|Chromium/i.test(b.brand)) &&
      !(navigator as any).userAgentData?.brands?.some((b: any) => /Edge|Opera/i.test(b.brand));
    const isChrome = (isChromeBrands ?? isChromeUA) as boolean;
    setCanUseVoice(speechSupported && isChrome);
  }, []);

  const speak = (text: string) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      speechSynthesis.speak(u);
    } catch { }
  };

  // function renderPlot(config: any, messagePlotType: PlotType) {
  //   if (!config) return null;
  //   switch (messagePlotType) {
  //     case '2D':
  //       if (config.functions || config.implicitCurves) return <PlotBoard config={config} />;
  //       break;
  //     case 'Geometry':
  //       if (config.points || config.circles || config.segments) return <PlotBoard config={config} />;
  //       break;
  //     case '3D':
  //       if (config.surfaces || config.curves) return <Math3D config={config} />;
  //       return (
  //         <div className="text-white text-sm text-center">
  //           ❌ Cannot plot 3D graph. Try rephrasing your question like:
  //           <br />
  //           <code>"Plot a 3D sphere with radius 5"</code>
  //         </div>
  //       );
  //   }
  //   return (
  //     <div className="text-gray-400 text-sm text-center">
  //       ⚠️ No data found for plot type: <strong>{messagePlotType}</strong>
  //     </div>
  //   );
  // }

  function renderPlot(config: any, messagePlotType: PlotType) {
    if (!config) return null;
    switch (messagePlotType) {
      case '3D':
        if (config.surfaces || config.curves) return <Math3D config={config} />;
        return (
          <div className="text-white text-sm text-center">
            ❌ Cannot plot 3D graph. Try: <code>"Plot a 3D sphere with radius 5"</code>
          </div>
        );
      case '2D':
      default:
        // Unified PlotBoard supports both functions/implicitCurves and geometry objects
        // If config has none, show notice.
        if (
          config.functions || config.implicitCurves ||
          config.points || config.segments || config.circles || config.angles ||
          config.polygons || config.annotations
        ) {
          return <PlotBoard config={config} />;
        }
        return (
          <div className="text-gray-400 text-sm text-center">
            ⚠️ No data found for plot
          </div>
        );
    }
  }

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    try {
      const data = await postChat({ message: text, plotType });
      setMessages(prev => [...prev, { role: 'ai', ...data, plotType }]);
      if (data?.plaintext) speak(data.plaintext);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', markdown: 'Sorry, something went wrong while processing your request.' }]);
    } finally {
      setInput('');
      setLoading(false);
    }
  }, [input, plotType, loading]);

  const getInputSnapshot = useCallback(() => input, [input]);
  const handleInterim = useCallback((fullText: string) => setInput(fullText), []);
  const handleResult = useCallback((fullText: string) => setInput(fullText), []);

  return (
    <div>
      <header>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#409adfff' }}>MATH_VIS</h1>
      </header>

      <main className="content-area">
        <div>
          {messages.map((msg, i) =>
            msg.role === 'ai' ? (
              <div key={i} className="ai-response">
                <div className="ai-content">
                  {msg.explanation && (
                    <div className="ai-math">
                      <BlockMath>{msg.explanation}</BlockMath>
                    </div>
                  )}
                  <MessageBubble content={msg.markdown || msg.explanation || msg.plaintext || ''} />
                </div>
                <div className="ai-plot">{renderPlot(msg.config, msg.plotType as PlotType)}</div>
              </div>
            ) : (
              <div key={i} className="user-question">
                <div className="user-bubble">{msg.content}</div>
              </div>
            )
          )}
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="search-bar-modern"
        >
          {canUseVoice && (
            <VoiceInput
              getInputSnapshot={getInputSnapshot}
              onInterim={handleInterim}
              onResult={handleResult}
              continuous={true}
            />
          )}

          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a math question..."
            className="input-field-modern"
          />

          {/* <div className="plot-buttons">
            <button 
            type="button" 
            title="Supports: functions, implicit curves, parametric 2D"
            onClick={() => setPlotType('2D')} 
            className={`plot-button ${plotType === '2D' ? 'active' : ''}`}>
              2D
            </button>
            <button 
            type="button"
            title="Supports: surfaces, curves" 
            onClick={() => setPlotType('3D')} 
            className={`plot-button ${plotType === '3D' ? 'active' : ''}`}>
              3D
            </button>
            <button 
            type="button"
            title="Supports: points, segments, circles, angles" 
            onClick={() => setPlotType('Geometry')} 
            className={`plot-button ${plotType === 'Geometry' ? 'active' : ''}`}>
              Geometry
            </button>
          </div> */}

          <div className="plot-buttons">
            <button
              type="button"
              title="2D functions, implicit curves, and geometry"
              onClick={() => setPlotType('2D')}
              className={`plot-button ${plotType === '2D' ? 'active' : ''}`}
            >
              2D
            </button>
            <button
              type="button"
              title="3D surfaces and curves"
              onClick={() => setPlotType('3D')}
              className={`plot-button ${plotType === '3D' ? 'active' : ''}`}
            >
              3D
            </button>
          </div>

          <button type="submit" className="submit-button-modern" disabled={loading}>
            {loading ? 'Sending…' : 'Send'}
          </button>
        </form>
      </main>

      <footer>AI Tutor MVP © 2025</footer>
    </div>
  );
}