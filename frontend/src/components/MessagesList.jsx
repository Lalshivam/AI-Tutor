import GeoGebra from "./GeoGebra";
import Graph from "./Graph";
import ReactMarkdown from "react-markdown";
import GeometryBoard from "./GeometryBoard";
import Animate from "./Animate";
import FunctionPlots from "./FunctionPlots";
import Math3D from "./Math3D";
import Quiz from "./Quiz";

export default function MessagesList({ messages }){
    return (
    <div className="messages">
        {messages.map((msg, i) => {
        if (msg.type === "loading") {
          return <div key={i} className="message ai loading"></div>;
        }
        if (msg.sender === "user") {
            return <div key={i} className="message user">{msg.text}</div>;
        }

        if (msg.type === "composite") {
            console.log(msg);
            return (
            <div key={i} className="message ai">
                {msg.text && <p className="ai-text">{msg.text}</p>}
                {msg.graph &&
                <div className="ai-graph">
                 <Animate config={msg.graph} />
                </div> 
                }
                {msg.exp && <p className="ai-exp">
                    <div className="markdown">
                    <ReactMarkdown>{msg.exp}</ReactMarkdown>
                    </div></p>
                }
            </div>
            );
        }

        return <div key={i} className="message ai"><ReactMarkdown>{msg.exp}</ReactMarkdown></div>;
        })}
    </div>
    );
}