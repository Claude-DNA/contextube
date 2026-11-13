# Layered-context benchmark

Two runs, 12 November 2026. The second run, at the end of this file, is the one to quote.

# First run: fixed blocks of material

Question: does an AI answer questions about a work better with its ConteXtube layers or cloud than with
nothing, or than with the same amount of raw text?

## Method

- Five works: Peculiarities of Planetary Conquest (not in any model's training data), The Nose,
  Rip Van Winkle, A Christmas Carol, The Time Machine.
- 20 questions per work (12 on details, 8 on the work as a whole), written by gpt-6-luna from the full
  text only. It never saw the cloud.
- Five kinds of material: nothing; layers L1–L4 (about 900 tokens); the cloud (about 1,300–2,100 tokens
  for the classics); the opening of the raw text cut to the cloud's size; the full text (10,000–45,000
  tokens for the classics).
- Two answering models (gpt-6-luna, gpt-5.4-mini). They wrote short answers with no options shown, and
  gpt-6-luna marked each against the reference answer.

A first multiple-choice version was discarded: models scored 88% with no material at all, including 85%
on the unseen story, because the wrong options were easy to rule out. Its files are `answers.json` and
`results.json`.

## Results (percent correct; `results-open.json`)

| | Nothing | Layers | Cloud | Raw text, cloud-sized | Full text |
|---|---|---|---|---|---|
| All questions | 46 | 50 | 59 | 60 | 82 |
| Detail questions | 42 | 42 | 51 | 60 | 87 |
| Whole-work questions | 52 | 62 | 71 | 61 | 74 |
| Four classics | 51 | 52 | 51 | 52 | 81 |
| Unseen story | 25 | 42 | 90 | 95 | 82 |

## Reading them

- On questions about the work as a whole, the cloud scored close to the full text (71 against 74) at
  about a twentieth of the size, and above the same amount of raw text (61).
- On details, the cloud did not beat the same amount of raw text, and the full text was far ahead.
- On the four classics overall, the cloud added nothing over the model's own memory.
- For the unseen story the cloud is twice as long as the story itself, so "raw text, cloud-sized" there is
  the whole story. That row shows that the cloud carries the story, not that it saves anything.

## Limits

- The numbers are noisy. On the unseen story, "raw text, cloud-sized" and "full text" are the same
  material and scored 95 and 82. Differences under about 15 points should not be trusted.
- One run, 100 questions, one judge model, which is also the question writer.
- The cloud was tested as a fixed block of text. The product's idea is that an agent starts shallow and
  fetches deeper layers when it needs them; that was not tested.

# Second run: fetching deeper

The first run handed the cloud over as one block. This run lets the model search the work's full text
through ConteXtube (`GET /api/v1/content/<slug>/layer/5?q=<words>&limit=3`), three passages per question.

## Method

- Same five works; 154 new questions (half details, half whole-work), written by gpt-6-luna from the full
  text only. Answered by gpt-6-luna and gpt-5.4-mini with no options shown; marked by gpt-5.5.
- Six kinds of help: nothing; the cloud; search only (the model picks search words from the question);
  cloud, searching only when unsure; cloud, always searching; the full text.
- "Tokens read" is per question as if questions were asked one at a time, four classics only.

## Results (percent correct; `results2.json`)

| | Nothing | Cloud | Search only | Cloud, search when unsure | Cloud, always search | Full text |
|---|---|---|---|---|---|---|
| All questions | 60 | 70 | 84 | 82 | 86 | 87 |
| Detail questions | 45 | 61 | 88 | 79 | 86 | 91 |
| Whole-work questions | 74 | 80 | 80 | 84 | 87 | 84 |
| Four classics | 65 | 67 | 85 | 81 | 85 | 90 |
| Unseen story | 40 | 82 | 82 | 85 | 94 | 76 |
| Tokens read per question | 0 | 1,663 | 1,163 | 2,171 | 2,814 | 26,611 |

## Reading them

- Cloud plus search scored the same as reading the full text (86 against 87) on about a tenth of the tokens.
- Search does most of that work: search alone scored 84 on under a twentieth of the tokens.
- The cloud's own contribution is on whole-work questions: 87 with cloud and search against 80 with
  search alone. That gap is about two standard errors, so it is suggestive, not settled.
- Left to decide, a model holding the cloud searched for only 36% of questions and lost accuracy on
  details (79 against 88 for search alone). The cloud makes models overconfident about facts; agents
  should be told to confirm details by search.

## Limits

- About 300 answers per column, so differences under about 6 points are noise (10 for the detail and
  whole-work rows). One run.
- Question writer and one of the two answering models are the same model. Search is keyword search.
- One unseen work, and it is short.
