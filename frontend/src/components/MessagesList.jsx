import GeoGebra from "./GeoGebra";
import Graph from "./Graph";
import ReactMarkdown from "react-markdown";
import GeometryBoard from "./GeometryBoard";
import Animate from "./Animate";
import FunctionPlots from "./FunctionPlots";
import Math3D from "./Math3D";

export default function MessagesList({ messages }){
    return(
        <div className="messsages">
            {messages.map((msg,i) => {
                if (msg.type === "graph") {
                    console.log(msg.text);
                    return <Math3D key={`3d-${i}`} config={msg.text}/>;
                    //<FunctionPlots key={`func-${i}`} config={msg.text}/>;
                    //<Animate/>
                    //<GeometryBoard key={`geo-${i}`} config={msg.text}/>;
                            {/* <SliderGraph key={`slider-${i}`} />
                            <ProofBoard key={`proof-${i}`} /> */}
                    //<PlotlyGraph />//<GeoGebra /> //<Graph key={i} equation={msg.text} />;
                }
                return msg.sender === "user"?
                (<div key={i} className="message user">{msg.text}</div>):
                (<div key={i} className="message ai"><ReactMarkdown>{msg.text}</ReactMarkdown></div>)
            })}  
        </div>
    );
}
