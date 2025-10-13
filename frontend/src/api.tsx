export const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '';

export async function postChat(payload: any) {
  const base = API_BASE.replace(/\/$/, ''); // remove trailing slash if any
  const url = `${base}/api/chat`;           // ensure /api/chat on backend
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}