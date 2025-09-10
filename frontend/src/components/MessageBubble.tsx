//message-bubble component to render messages with LaTeX support
import TeX from '@matejmazur/react-katex';
import 'katex/dist/katex.min.css';

export default function MessageBubble({ content }: { content: string }) {
  const parts = content.split(/\$(.*?)\$/g); // Split by $...$
  return (
    <div className="bg-white p-4 rounded shadow">
      {parts.map((part, i) =>
        i % 2 === 1 ? <TeX key={i} math={part} /> : <span key={i}>{part}</span>
      )}
    </div>
  );
}
