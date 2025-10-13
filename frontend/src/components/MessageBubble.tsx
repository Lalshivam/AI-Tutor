//message-bubble component to render messages with LaTeX support

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function MessageBubble({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        children={content}
      
      />
    </div>
  );
}


// import TeX from '@matejmazur/react-katex';
// import 'katex/dist/katex.min.css';

// export default function MessageBubble({ content }: { content: string }) {
//   const parts = content.split(/\$(.*?)\$/g); // Split by $...$
//   return (
//     <div className="">
//       {parts.map((part, i) =>
//         i % 2 === 1 ? <TeX key={i} math={part} /> : <span key={i}>{part}</span>
//       )}
//     </div>
//   );
// }