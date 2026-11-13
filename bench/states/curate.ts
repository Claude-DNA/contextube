// Turns the raw chapter-by-chapter states into the published library: one name per character,
// quotes checked against the chapter, near-duplicates dropped, the most distinct moments kept.
import fs from 'fs';
import { describeFormula, formatFormula, type StateFormula } from '/home/claude/contextcloud/src/lib/state-formula';
const key = fs.readFileSync('/tmp/claude-0/-home-claude/332e24a8-cc4b-59a5-952b-fbd1b77aef9a/scratchpad/replay/live_key.txt', 'utf8').trim();
const chapters = JSON.parse(fs.readFileSync('chapters.json', 'utf8')) as { book: string; chapter: string; title: string; text: string }[];
const raw = Object.values(JSON.parse(fs.readFileSync('raw.json', 'utf8')) as Record<string, any[]>).flat().filter((s) => s.parsed && s.moment && s.inside && s.outside && s.situation);

const NAMES: [RegExp, string][] = [
  [/alyosha|alex(e[iy]|ey) (fyodorovi|karamazov)|^alex(e[iy]|ey)$/i, 'Alyosha Karamazov'], [/dmitri|mitya/i, 'Dmitri Karamazov'], [/^ivan\b|ivan (fyodorovi|karamazov)/i, 'Ivan Karamazov'],
  [/fyodor pavlovi|^fyodor karamazov|old karamazov/i, 'Fyodor Karamazov'], [/smerdyakov/i, 'Smerdyakov'], [/grushenka|agrafena/i, 'Grushenka'],
  [/katerina ivanovna|katya/i, 'Katerina Ivanovna'], [/zoss?ima/i, 'Father Zossima'], [/lise|liza|lizaveta khokhlakov/i, 'Lise Khokhlakov'], [/madame hohlakov|madame khokhlakov|mme\.? hohlakov/i, 'Madame Hohlakov'],
  [/snegiryov|the captain/i, 'Captain Snegiryov'], [/ilusha|ilyusha/i, 'Ilusha'], [/kolya|krass?otkin/i, 'Kolya Krassotkin'], [/rakitin/i, 'Rakitin'], [/grigory/i, 'Grigory'],
  [/mi[uü]sov/i, 'Miüsov'], [/ferapont/i, 'Father Ferapont'], [/pa[ïi]ssy/i, 'Father Païssy'], [/perhotin/i, 'Perhotin'], [/fetyukovitch/i, 'Fetyukovitch'], [/ippolit|prosecutor/i, 'The prosecutor'],
  [/grand inquisitor/i, 'The Grand Inquisitor'], [/devil/i, 'The devil'], [/fenya/i, 'Fenya'], [/samsonov/i, 'Samsonov'], [/trifon/i, 'Trifon Borissovitch'],
];
const canon = (n: string) => { if (/lizaveta smerdyast|stinking lizaveta/i.test(n)) return 'Lizaveta Smerdyastchaya'; for (const [re, name] of NAMES) if (re.test(n)) return name; return n.trim(); };
const loosen = (t: string) => t.replace(/\s+/g, ' ').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[‐-―]/g, '-').toLowerCase();
const slug = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const roman = (b: string) => b.replace(/\.$/, '');

for (const s of raw) {
  s.character = canon(String(s.character));
  const text = chapters[s.index].text.replace(/\s+/g, ' '); const q = String(s.quote ?? '').replace(/\s+/g, ' ').trim().replace(/^["“]+|["”]+$/g, '');
  const at = q.length >= 12 ? loosen(text).indexOf(loosen(q)) : -1;
  s.quote = at >= 0 ? text.slice(at, at + q.length) : '';
  s.weight = [1, 2, 3].includes(Number(s.weight)) ? Number(s.weight) : 1;
}
const byChar = new Map<string, any[]>(); for (const s of raw) byChar.set(s.character, [...(byChar.get(s.character) ?? []), s]);
console.log('raw', raw.length, 'characters', byChar.size, 'quotes exact', raw.filter(s => s.quote).length);

async function ask(prompt: string) {
  for (let t = 0; t < 4; t++) { try {
    const r = await fetch('https://contextcloud.studio/api/v1/ask', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(240000),
      body: JSON.stringify({ system: 'You are editing a library of character states for writers. You choose and label; you never invent facts.', prompt, model: 'gpt-6-luna', json: true, max_tokens: 5000, temperature: 0.2 }) });
    const x: string = (await r.json()).text ?? ''; return JSON.parse(x.slice(x.indexOf('{'), x.lastIndexOf('}') + 1));
  } catch (e) { if (t === 3) throw e; await new Promise(r => setTimeout(r, 3000 * (t + 1))); } }
}
(async () => {
  const kept: any[] = [];
  const jobs = [...byChar.entries()].map(async ([name, list]) => {
    const strong = list.filter(s => s.weight >= 2);
    if (list.length <= 2) { kept.push(...strong.filter(s => s.weight === 3 || list.length === 2)); return; }
    const cap = list.length >= 40 ? 16 : list.length >= 20 ? 12 : list.length >= 8 ? 8 : 4;
    const r = await ask(`These are states of one character, ${name}, recorded chapter by chapter from a novel, in story order.
Choose up to ${cap} for the library: the moments that are most distinct from each other and most useful to a writer who wants to borrow "a person like this, in a situation like this". Prefer turning points (weight 3). Never keep two with nearly the same cause and the same formula; keep the stronger. Cover the character's whole arc, not only its start.
For each one you keep, give "i" and a "moment" label: lowercase, no character names, naming the cause in at most eight words, phrased so that it reads after the character's name ("after his elder's death", "confessing to the brother he envies", "when the money is found on him").

${list.map((s, i) => `${i}. [${roman(s.book.split('.')[0])} ch ${s.chapter}; weight ${s.weight}; ${s.formula_text}] ${s.moment}: ${s.situation} ${s.inside}`).join('\n')}

Return JSON {"keep": [{"i": 0, "moment": "..."}]}.`);
    for (const k of (r.keep ?? []).slice(0, cap)) { const s = list[k.i]; if (s && !s._kept) { s._kept = true; if (typeof k.moment === 'string' && k.moment.trim()) s.moment = k.moment.trim(); kept.push(s); } }
  });
  await Promise.all(jobs);
  kept.sort((a, b) => a.index - b.index);
  const seen = new Set<string>(); const states = [];
  for (const s of kept) {
    const f = s.parsed as StateFormula;
    // "Calm is missing" is true of every strong state, so it says nothing.
    if (f.signs?.calm === -1) { f.base = f.base.filter((b) => b !== 'calm'); delete f.signs.calm; }
    const felt = f.base.filter((b) => (f.signs?.[b] ?? 1) === 1);
    let id = `${slug(s.character)}-${slug(s.moment)}`.slice(0, 90); while (seen.has(id)) id += '-2'; seen.add(id);
    states.push({
      id, character: s.character, moment: String(s.moment).replace(/\.$/, ''), situation: s.situation, inside: s.inside, outside: s.outside,
      formula: formatFormula(f), base: felt, missing: f.base.filter((b) => f.signs?.[b] === -1), ...(f.modifier ? { modifier: f.modifier } : {}), intensity: f.intensity ?? 2, color: f.color,
      for_ai: describeFormula({ ...f, name: '' }), ...(s.quote ? { quote: s.quote } : {}),
      where: `${s.book.replace(/\.\s*/, ': ').replace(/: $/, '')}, Chapter ${s.chapter}: ${s.chapter_title}`, weight: s.weight,
    });
  }
  const out = { slug: 'the-brothers-karamazov', title: 'The Brothers Karamazov', author: 'Fyodor Dostoevsky', source: 'Constance Garnett\'s translation, Project Gutenberg', source_url: 'https://www.gutenberg.org/ebooks/28054', states };
  fs.writeFileSync('/home/claude/contextube/src/data/states/the-brothers-karamazov.json', JSON.stringify(out, null, 1));
  const c = new Map<string, number>(); for (const s of states) c.set(s.character, (c.get(s.character) ?? 0) + 1);
  console.log('kept', states.length, 'of', raw.length, '| with quote', states.filter(s => s.quote).length, '| with modifier', states.filter(s => s.modifier).length);
  console.log([...c.entries()].sort((a, b) => b[1] - a[1]).map(([n, k]) => `${n} ${k}`).join(' · '));
})();
