//message-bubble component to render messages with LaTeX support
import TeX from '@matejmazur/react-katex';
import 'katex/dist/katex.min.css';

export default function MessageBubble({ content }: { content: string }) {
  const parts = content.split(/\$(.*?)\$/g); // Split by $...$
  return (
    <div className="text-white p-6 rounded-2xl shadow-xl border border-[#343541] max-w-[85%] mx-auto text-lg flex flex-col items-center">
      {parts.map((part, i) =>
        i % 2 === 1 ? <TeX key={i} math={part} /> : <span key={i}>{part}</span>
      )}
    </div>
  );
}