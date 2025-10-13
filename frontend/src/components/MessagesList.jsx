import GeoGebra from "./GeoGebra";
import Graph from "./Graph";
import ReactMarkdown from "react-markdown";
import GeometryBoard from "./GeometryBoard";
import Animate from "./Animate";
import FunctionPlots from "./FunctionPlots";
import Math3D from "./Math3D";
import Quiz from "./Quiz";
import VideoGen from "./VideoGen";
import { GiChaingun } from "react-icons/gi";

export default function MessagesList({ messages }){
    const component_map = {
        1: GeometryBoard,
        2: Math3D,
        3: Animate,
        4: Quiz,
        5: VideoGen
    };
    return (
    <div className="messages">
        {messages.map((msg, i) => {
        if (msg.type === "loading") {
          return <div key={i} className="loading"><GiChaingun className="spin" size={16} /></div>;
        }
        if (msg.sender === "user") {
             return <div key={i} className="message user">{msg.text}</div>;
        }
        if (msg.type===4){
            return <div key={i}><Quiz config={msg.graph}/></div>;
        }
        if (msg.type !== null) {
            console.log(msg);
            const VizComponent = component_map[msg.type];
            return (
            <div key={i} className="message ai">
                {msg.text && <p className="ai-text">{msg.text}</p>}
                {msg.graph &&
                <div className="ai-graph">
                 <VizComponent config={msg.graph} />
                </div> 
                }
                {msg.exp && <div className="ai-exp">
                    <div className="markdown">
                    <ReactMarkdown>{msg.exp}</ReactMarkdown>
                    </div></div>
                }
            </div>
            );
        }

        return <div key={i} className="message ai"><ReactMarkdown>{msg.exp}</ReactMarkdown></div>;
        })}
    </div>
    );}