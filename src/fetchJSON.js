export async function fetchJSON(u) {
  const r = await fetch(u);
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}
