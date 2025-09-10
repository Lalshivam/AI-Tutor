import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY);

export async function explainWithGemini(message: string, mathResult: any) {
  
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You're a math tutor. Explain the following question in simple steps, using LaTeX ($...$) for math. Include any steps from the math engine below.

User: ${message}
Math steps: ${JSON.stringify(mathResult.latexSteps)}
`;

try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return {
      markdown: text,
      plaintext: text.replace(/\$.*?\$/g, ''),
    };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return {
      markdown: 'I\'m sorry, I couldn\'t get an explanation at this time.',
      plaintext: 'I\'m sorry, I couldn\'t get an explanation at this time.',
    };
  }
}