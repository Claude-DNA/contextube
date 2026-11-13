"""Layered-context benchmark: does an AI answer questions about a work better with its ConteXtube
cloud or layers than with nothing, or with the same amount of raw text?

  STUDIO_KEY=cc_live_... python3 bench/run.py questions   # write questions from each full text (once)
  STUDIO_KEY=cc_live_... python3 bench/run.py answer      # answer them under every condition
  python3 bench/run.py report                             # results.json + RESULTS.md

Questions are written by a model that sees only the full text (never the cloud), so they do not
favour what the cloud happens to contain. Models are asked through Context Cloud Studio's
POST /api/v1/ask, which uses the account's own key.
"""
import json, os, random, re, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
SEED = os.path.join(HERE, "..", "seed")
TUBE = os.environ.get("BASE_URL", "https://contextube.ai")
STUDIO = os.environ.get("STUDIO_URL", "https://contextcloud.studio")
WRITER = os.environ.get("WRITER_MODEL", "gpt-6-luna")
ANSWERERS = os.environ.get("ANSWER_MODELS", "gpt-6-luna,gpt-5.4-mini").split(",")
WORKS = ["peculiarities-of-planetary-conquest", "peace-treaty-architecture", "echo", "the-nose", "rip-van-winkle", "a-christmas-carol", "the-time-machine"]
UNSEEN = {"peculiarities-of-planetary-conquest", "peace-treaty-architecture", "echo"}  # not in any model's training data
CONDITIONS = ["none", "layers", "cloud", "raw_same_size", "full_text"]
N_DETAIL, N_WHOLE = 12, 8

def ask(prompt, model, system=None, max_tokens=6000, tries=4):
    body = json.dumps({"prompt": prompt, "system": system, "model": model, "json": True, "max_tokens": max_tokens}).encode()
    for t in range(tries):
        try:
            req = urllib.request.Request(f"{STUDIO}/api/v1/ask", data=body, headers={"Authorization": f"Bearer {os.environ['STUDIO_KEY']}", "Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=300) as r:
                text = json.load(r)["text"]
            return json.loads(text[text.index("{"): text.rindex("}") + 1])
        except Exception as e:  # network resets and the odd malformed answer
            err = getattr(e, "read", lambda: b"")()[:300] if hasattr(e, "read") else str(e)[:200]
            if t == tries - 1: raise RuntimeError(f"{model}: {err}")
            time.sleep(5 * (t + 1))

def get(url):
    with urllib.request.urlopen(url, timeout=60) as r: return r.read().decode()

def tokens(s): return round(len(s) / 4)  # rough: four characters to a token

def contexts(slug):
    full = open(os.path.join(SEED, "sources", slug + ".txt"), encoding="utf-8").read()
    work = json.load(open(os.path.join(SEED, slug + ".json"), encoding="utf-8"))
    lines = []
    for c in work["chunks"]:
        if c["layer"] <= 4:
            lines.append(f"[L{c['layer']}] {c['text']}" + (f'\n  Quote: "{c["source_quote"]}"' if c.get("source_quote") else ""))
    layers = f"# {work['title']} ({work.get('source_author') or work.get('creator_name')})\n{work['description']}\n\n" + "\n\n".join(lines)
    cloud = get(f"{TUBE}/api/v1/clouds/{slug}/text")
    return {"none": "", "layers": layers, "cloud": cloud, "raw_same_size": full[: len(cloud)], "full_text": full}

def make_questions():
    out = {}
    def one(slug):
        full = contexts(slug)["full_text"]
        p = f"""Below is the complete text of a work. Write multiple-choice questions that test whether a reader knows this text.

Write exactly {N_DETAIL} "detail" questions and {N_WHOLE} "whole" questions.
- detail: a specific fact stated in the text (who did what, where, what was said, what an object was). Spread them evenly from the beginning to the end of the text. Each must be answerable only by someone who has this text; avoid anything a person could guess from general knowledge or from the title.
- whole: needs an understanding of the work as a whole: why something happens, how a character changes, what an idea or the ending means, how two parts connect.
Each question has four options, one clearly correct according to the text and three plausible but wrong. Make the options similar in length and style. Never refer to "the passage" or "the text above".
For each, give "evidence": a short exact quotation from the text that settles the answer.

Return JSON: {{"questions": [{{"type": "detail"|"whole", "question": "...", "options": ["...", "...", "...", "..."], "answer": <index 0-3 of the correct option>, "evidence": "..."}}]}}

TEXT
{full}"""
        qs = ask(p, WRITER, max_tokens=12000)["questions"]
        rnd = random.Random(slug)
        clean = []
        for q in qs:
            if q.get("type") not in ("detail", "whole") or len(q.get("options", [])) != 4 or q.get("answer") not in (0, 1, 2, 3): continue
            order = [0, 1, 2, 3]; rnd.shuffle(order)  # so the right answer is not always in the same place
            clean.append({"type": q["type"], "question": q["question"], "options": [q["options"][i] for i in order], "answer": order.index(q["answer"]), "evidence": q.get("evidence", "")})
        norm = lambda s: re.sub(r"\W+", " ", s).lower().strip()
        for q in clean: q["evidence_found"] = bool(q["evidence"]) and norm(q["evidence"])[:60] in norm(full)
        print(slug, len(clean), "questions,", sum(q["evidence_found"] for q in clean), "with evidence found in the text", flush=True)
        return slug, clean
    with ThreadPoolExecutor(5) as ex:
        for slug, qs in ex.map(one, WORKS): out[slug] = qs
    json.dump(out, open(os.path.join(HERE, "questions.json"), "w"), ensure_ascii=False, indent=1)

def answer():
    qs = json.load(open(os.path.join(HERE, "questions.json")))
    path = os.path.join(HERE, "answers.json")
    done = json.load(open(path)) if os.path.exists(path) else {}
    jobs = []
    for slug in WORKS:
        ctx = contexts(slug)
        for cond in CONDITIONS:
            for model in ANSWERERS:
                key = f"{slug}|{cond}|{model}"
                if key not in done: jobs.append((key, slug, cond, model, ctx[cond]))
    def one(job):
        key, slug, cond, model, context = job
        title = json.load(open(os.path.join(SEED, slug + ".json")))["title"]
        listing = "\n\n".join(f"{i + 1}. {q['question']}\n" + "\n".join(f"   {'ABCD'[j]}) {o}" for j, o in enumerate(q["options"])) for i, q in enumerate(qs[slug]))
        head = (f"Answer these questions about the work \"{title}\" using the material below. If the material does not settle a question, give your best guess."
                if context else f"Answer these questions about the work \"{title}\" from what you know. If you do not know, give your best guess.")
        p = f"""{head}
Return JSON: {{"answers": {{"1": "A", "2": "C", ...}}}} with one letter for every question.
{("MATERIAL" + chr(10) + context + chr(10) + chr(10)) if context else ""}QUESTIONS
{listing}"""
        a = ask(p, model, max_tokens=3000)["answers"]
        print("ok", key, flush=True)
        return key, {"answers": [str(a.get(str(i + 1), "")).strip()[:1].upper() for i in range(len(qs[slug]))], "context_chars": len(context)}
    with ThreadPoolExecutor(6) as ex:
        for key, res in ex.map(one, jobs):
            done[key] = res
            json.dump(done, open(path, "w"), indent=1)

def answer_open():
    """No options shown: the model writes a short answer, and a judge marks it against the reference."""
    qs = json.load(open(os.path.join(HERE, "questions.json")))
    path = os.path.join(HERE, "open.json")
    done = json.load(open(path)) if os.path.exists(path) else {}
    jobs = []
    for slug in WORKS:
        ctx = contexts(slug)
        for cond in CONDITIONS:
            for model in ANSWERERS:
                key = f"{slug}|{cond}|{model}"
                if key not in done: jobs.append((key, slug, cond, model, ctx[cond]))
    def one(job):
        key, slug, cond, model, context = job
        title = json.load(open(os.path.join(SEED, slug + ".json")))["title"]
        listing = "\n".join(f"{i + 1}. {q['question']}" for i, q in enumerate(qs[slug]))
        head = (f"Answer these questions about the work \"{title}\" using the material below." if context
                else f"Answer these questions about the work \"{title}\" from what you know.")
        p = f"""{head} Answer each in one short sentence. If you cannot tell, give your single best guess anyway.
Return JSON: {{"answers": {{"1": "...", "2": "...", ...}}}} with an answer for every question.
{("MATERIAL" + chr(10) + context + chr(10) + chr(10)) if context else ""}QUESTIONS
{listing}"""
        a = ask(p, model, max_tokens=4000)["answers"]
        given = [str(a.get(str(i + 1), "")).strip()[:400] for i in range(len(qs[slug]))]
        marking = "\n\n".join(f"{i + 1}. Question: {q['question']}\n   Reference answer: {q['options'][q['answer']]}\n   Evidence from the text: {q['evidence']}\n   Candidate answer: {g or '(none)'}" for i, (q, g) in enumerate(zip(qs[slug], given)))
        j = ask(f"""Mark each candidate answer against its reference answer. It is correct only if it states the same fact or idea as the reference; a different, vaguer or partly wrong answer is incorrect. Wording may differ.
Return JSON: {{"marks": {{"1": true, "2": false, ...}}}} for every item.

{marking}""", WRITER, max_tokens=2000)["marks"]
        print("ok", key, flush=True)
        return key, {"given": given, "marks": [bool(j.get(str(i + 1))) for i in range(len(qs[slug]))], "context_chars": len(context)}
    with ThreadPoolExecutor(6) as ex:
        for key, res in ex.map(one, jobs):
            done[key] = res
            json.dump(done, open(path, "w"), ensure_ascii=False, indent=1)

def report_open():
    qs = json.load(open(os.path.join(HERE, "questions.json"))); ans = json.load(open(os.path.join(HERE, "open.json")))
    rows = []
    for key, r in ans.items():
        slug, cond, model = key.split("|")
        for q, m in zip(qs[slug], r["marks"]):
            rows.append({"work": slug, "condition": cond, "model": model, "type": q["type"], "correct": m, "unseen": slug in UNSEEN})
    def acc(f):
        sel = [r["correct"] for r in rows if f(r)]
        return round(100 * sum(sel) / len(sel)) if sel else None
    by = lambda f: {c: acc(lambda r: r["condition"] == c and f(r)) for c in CONDITIONS}
    res = {"method": "open answers, judged against the reference", "writer_and_judge": WRITER, "answerers": ANSWERERS, "questions_per_work": {s: len(qs[s]) for s in WORKS},
           "context_chars": {c: {s: ans[f"{s}|{c}|{ANSWERERS[0]}"]["context_chars"] for s in WORKS} for c in CONDITIONS},
           "overall": by(lambda r: True), "by_model": {m: by(lambda r: r["model"] == m) for m in ANSWERERS},
           "by_type": {t: by(lambda r: r["type"] == t) for t in ("detail", "whole")},
           "unseen_work": by(lambda r: r["unseen"]), "known_classics": by(lambda r: not r["unseen"]),
           "by_work": {s: by(lambda r: r["work"] == s) for s in WORKS}}
    json.dump(res, open(os.path.join(HERE, "results-open.json"), "w"), indent=1)
    for k in ("overall", "by_model", "by_type", "unseen_work", "known_classics", "by_work"): print(k, json.dumps(res[k]))

def report():
    qs = json.load(open(os.path.join(HERE, "questions.json"))); ans = json.load(open(os.path.join(HERE, "answers.json")))
    rows = []
    for key, r in ans.items():
        slug, cond, model = key.split("|")
        for q, a in zip(qs[slug], r["answers"]):
            rows.append({"work": slug, "condition": cond, "model": model, "type": q["type"], "correct": a == "ABCD"[q["answer"]], "unseen": slug in UNSEEN})
    def acc(f):
        sel = [r["correct"] for r in rows if f(r)]
        return (round(100 * sum(sel) / len(sel)), len(sel)) if sel else (None, 0)
    size = {c: {s: ans[f"{s}|{c}|{ANSWERERS[0]}"]["context_chars"] for s in WORKS} for c in CONDITIONS}
    res = {"writer": WRITER, "answerers": ANSWERERS, "works": WORKS, "questions": {s: len(qs[s]) for s in WORKS}, "context_chars": size,
           "overall": {c: acc(lambda r: r["condition"] == c)[0] for c in CONDITIONS},
           "by_model": {m: {c: acc(lambda r: r["condition"] == c and r["model"] == m)[0] for c in CONDITIONS} for m in ANSWERERS},
           "by_type": {t: {c: acc(lambda r: r["condition"] == c and r["type"] == t)[0] for c in CONDITIONS} for t in ("detail", "whole")},
           "unseen_work": {c: acc(lambda r: r["condition"] == c and r["unseen"])[0] for c in CONDITIONS},
           "known_classics": {c: acc(lambda r: r["condition"] == c and not r["unseen"])[0] for c in CONDITIONS},
           "by_work": {s: {c: acc(lambda r: r["condition"] == c and r["work"] == s)[0] for c in CONDITIONS} for s in WORKS}}
    json.dump(res, open(os.path.join(HERE, "results.json"), "w"), indent=1)
    print(json.dumps(res, indent=1))

if __name__ == "__main__":
    {"questions": make_questions, "answer": answer, "report": report, "open": answer_open, "report-open": report_open}[sys.argv[1]]()
