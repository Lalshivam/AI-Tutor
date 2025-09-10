import { create, all } from 'mathjs';
import nerdamer from 'nerdamer/all.min.js';

const math = create(all as any);

export async function solveMath(input: string) {
  let numeric: any = null;
  let steps: string[] = [];

  try {
    numeric = math.evaluate(input);
    steps.push(`Evaluation: ${input} = ${numeric}`);
  } catch {}

  try {
    const simp = nerdamer(input).simplify().toTeX();
    steps.push(`$${input} = ${simp}$`);
  } catch {}

  return { latexSteps: steps, numeric };
}
