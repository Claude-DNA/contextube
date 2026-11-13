"""Fetch-deeper benchmark: an agent that holds the cloud and pulls full-text passages only when it
needs them, against the cloud alone, search alone, and the full text.

  STUDIO_KEY=cc_live_... python3 bench/run2.py questions | answer | report

Search is ConteXtube's own: GET /api/v1/content/<slug>/layer/5?q=<words>&limit=3
"""
import json, os, sys, urllib.parse
from concurrent.futures import ThreadPoolExecutor
import run as B

B.N_DETAIL, B.N_WHOLE = 15, 15
JUDGE = os.environ.get("JUDGE_MODEL", "gpt-5.5")
CONDITIONS = ["none", "cloud", "search_only", "cloud_and_search", "cloud_always_search", "full_text"]
PER_Q = 3  # passages fetched per question
Q, A, R = (os.path.join(B.HERE, f) for f in ("questions2.json", "answers2.json", "results2.json"))

def questions():
    B.make_questions(); os.replace(os.path.join(B.HERE, "questions.json"), Q)

def passages(slug, words):
    d = json.loads(B.get(f"{B.TUBE}/api/v1/content/{slug}/layer/5?q={urllib.parse.quote(words)}&limit={PER_Q}"))
    return [c["text"] for c in d.get("chunks", [])]

def run_cell(slug, cond, model, qs, ctx, title):
    n = len(qs); numbered = "\n".join(f"{i + 1}. {q['question']}" for i, q in enumerate(qs))
    fmt = 'Return JSON: {"answers": {"1": "...", "2": "...", ...}} with an answer for every question.'
    rule = "Answer each in one short sentence. If you cannot tell, give your single best guess anyway."
    stats = {"material_chars": 0, "searched": 0, "passage_chars": 0}
    if cond in ("none", "cloud", "full_text"):
        m = {"none": "", "cloud": ctx["cloud"], "full_text": ctx["full_text"]}[cond]
        head = f'Answer these questions about the work "{title}" ' + ("using the material below." if m else "from what you know.")
        a = B.ask(f"{head} {rule}\n{fmt}\n{('MATERIAL' + chr(10) + m + chr(10) + chr(10)) if m else ''}QUESTIONS\n{numbered}", model, max_tokens=5000)["answers"]
        given = [str(a.get(str(i + 1), "")) for i in range(n)]
        stats["material_chars"] = len(m)
    else:
        cloud = ctx["cloud"] if cond != "search_only" else ""
        always = cond == "cloud_always_search"
        # Step 1: answer what the cloud settles; ask to search the full text for the rest.
        if cloud and always:
            p1 = f"""You are answering questions about the work "{title}". You have its cloud (a structured summary) below, and you can search the work's full text by keywords.
For each question give search words: 3 to 6 distinctive words likely to appear in the passage that holds the answer (names, objects, places; use the cloud to pick them).
Return JSON: {{"items": {{"1": {{"search": "word word word"}}, ...}}}} for every question.

CLOUD
{cloud}

QUESTIONS
{numbered}"""
        elif cloud:
            p1 = f"""You are answering questions about the work "{title}". You have its cloud (a structured summary) below, and you can search the work's full text by keywords.
For each question: if the cloud settles it, answer in one short sentence. If not, give search words instead: 3 to 6 distinctive words likely to appear in the passage that holds the answer (names, objects, places; use the cloud to pick them).
Return JSON: {{"items": {{"1": {{"answer": "..."}}, "2": {{"search": "word word word"}}, ...}}}} for every question.

CLOUD
{cloud}

QUESTIONS
{numbered}"""
        else:
            p1 = f"""You are answering questions about the work "{title}". You can search the work's full text by keywords.
For each question give search words: 3 to 6 distinctive words likely to appear in the passage that holds the answer (names, objects, places).
Return JSON: {{"items": {{"1": {{"search": "word word word"}}, ...}}}} for every question.

QUESTIONS
{numbered}"""
        items = B.ask(p1, model, max_tokens=5000)["items"]
        given = [""] * n; need = []
        for i in range(n):
            it = items.get(str(i + 1)) or {}
            if cloud and not always and it.get("answer") and not it.get("search"): given[i] = str(it["answer"])
            else: need.append((i, str(it.get("search") or qs[i]["question"])))
        stats["searched"] = len(need)
        # Step 2: fetch passages and answer, ten questions at a time.
        for k in range(0, len(need), 10):
            part = need[k:k + 10]; blocks = []
            for i, words in part:
                ps = passages(slug, words); stats["passage_chars"] += sum(map(len, ps))
                blocks.append(f"{i + 1}. {qs[i]['question']}\n   Passages found for \"{words}\":\n" + ("\n".join(f"   - {p}" for p in ps) or "   (nothing found)"))
            p2 = f"""Answer these questions about the work "{title}" using {'the cloud and ' if cloud else ''}the passages found for each. {rule}
Return JSON: {{"answers": {{"<question number>": "...", ...}}}} for every question listed.
{('CLOUD' + chr(10) + cloud + chr(10) + chr(10)) if cloud else ''}QUESTIONS AND PASSAGES
""" + "\n\n".join(blocks)
            a = B.ask(p2, model, max_tokens=3000)["answers"]
            for i, _ in part: given[i] = str(a.get(str(i + 1), ""))
        stats["material_chars"] = len(cloud) + stats["passage_chars"]
    given = [g.strip()[:400] for g in given]
    marking = "\n\n".join(f"{i + 1}. Question: {q['question']}\n   Reference answer: {q['options'][q['answer']]}\n   Evidence from the text: {q['evidence']}\n   Candidate answer: {g or '(none)'}" for i, (q, g) in enumerate(zip(qs, given)))
    j = B.ask(f"""Mark each candidate answer against its reference answer. It is correct only if it states the same fact or idea as the reference; a different, vaguer or partly wrong answer is incorrect. Wording may differ.
Return JSON: {{"marks": {{"1": true, "2": false, ...}}}} for every item.

{marking}""", JUDGE, max_tokens=3000)["marks"]
    return {"given": given, "marks": [bool(j.get(str(i + 1))) for i in range(n)], **stats}

def answer():
    qs = json.load(open(Q)); done = json.load(open(A)) if os.path.exists(A) else {}
    jobs = []
    for slug in B.WORKS:
        ctx = B.contexts(slug); title = json.load(open(os.path.join(B.SEED, slug + ".json")))["title"]
        for cond in CONDITIONS:
            for model in B.ANSWERERS:
                key = f"{slug}|{cond}|{model}"
                if key not in done: jobs.append((key, slug, cond, model, ctx, title))
    def one(j):
        key, slug, cond, model, ctx, title = j
        try: r = run_cell(slug, cond, model, qs[slug], ctx, title)
        except Exception as e: print("FAIL", key, str(e)[:200], flush=True); return key, None
        print("ok", key, flush=True); return key, r
    with ThreadPoolExecutor(6) as ex:
        for key, r in ex.map(one, jobs):
            if r: done[key] = r; json.dump(done, open(A, "w"), ensure_ascii=False, indent=1)

def report():
    qs = json.load(open(Q)); ans = json.load(open(A)); rows = []
    for key, r in ans.items():
        slug, cond, model = key.split("|")
        for q, m in zip(qs[slug], r["marks"]):
            rows.append({"work": slug, "condition": cond, "model": model, "type": q["type"], "correct": m, "unseen": slug in B.UNSEEN})
    def acc(f):
        sel = [r["correct"] for r in rows if f(r)]
        return round(100 * sum(sel) / len(sel)) if sel else None
    by = lambda f: {c: acc(lambda r: r["condition"] == c and f(r)) for c in CONDITIONS}
    classics = [s for s in B.WORKS if s not in B.UNSEEN]
    def cost(c):  # tokens read per question if questions were asked one at a time (classics only)
        t = []
        for s in classics:
            for m in B.ANSWERERS:
                r = ans[f"{s}|{c}|{m}"]; n = len(qs[s])
                fixed = {"none": 0, "cloud": r["material_chars"], "full_text": r["material_chars"], "search_only": 0, "cloud_and_search": r["material_chars"] - r["passage_chars"], "cloud_always_search": r["material_chars"] - r["passage_chars"]}[c]
                t.append((fixed + r["passage_chars"] / n) / 4)
        return round(sum(t) / len(t))
    res = {"writer": B.WRITER, "judge": JUDGE, "answerers": B.ANSWERERS, "questions": sum(len(qs[s]) for s in B.WORKS),
           "overall": by(lambda r: True), "by_model": {m: by(lambda r: r["model"] == m) for m in B.ANSWERERS},
           "by_type": {t: by(lambda r: r["type"] == t) for t in ("detail", "whole")},
           "known_classics": by(lambda r: not r["unseen"]), "unseen_work": by(lambda r: r["unseen"]),
           "classics_by_type": {t: by(lambda r: r["type"] == t and not r["unseen"]) for t in ("detail", "whole")},
           "by_work": {s: by(lambda r: r["work"] == s) for s in B.WORKS},
           "tokens_read_per_question_classics": {c: cost(c) for c in CONDITIONS},
           "share_of_questions_searched": {c: round(100 * sum(ans[f"{s}|{c}|{m}"]["searched"] for s in B.WORKS for m in B.ANSWERERS) / (2 * sum(len(qs[s]) for s in B.WORKS))) for c in ("search_only", "cloud_and_search", "cloud_always_search")}}
    json.dump(res, open(R, "w"), indent=1)
    for k, v in res.items(): print(k, json.dumps(v))

if __name__ == "__main__":
    {"questions": questions, "answer": answer, "report": report}[sys.argv[1]]()
