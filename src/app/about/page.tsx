import Link from "next/link";
import type { Metadata } from "next";
import { Page, Section } from "@/components/Page";
import { Wordmark } from "@/components/Wordmark";

export const metadata: Metadata = {
  title: "About",
  description: "ConteXtube builds cooperation between human and AI intelligence through the shared act of creation.",
};

const PROBLEMS = {
  human: [
    ["Displacement from labor", "Automation takes professions, and not only routine ones. Creative ones too."],
    ["Creative exhaustion", "Endless content devalues creation. Why write if AI writes in a second?"],
    ["Loss of meaning", "If a machine does everything, what is the value of a human?"],
  ],
  ai: [
    ["Cultural blindness", "AI doesn't understand why one metaphor hits the heart and another is dead."],
    ["Flat understanding", "Text without context is like a score without a musician."],
    ["No connections", "AI sees facts but not the fabric between them."],
    ["No embodiment", "No smell of morning coffee, no weight of loss."],
  ],
};

const SOLUTIONS = {
  human: {
    title: "Creating context: a new profession",
    items: ["Real work, not an imitation of employment", "Genuine creativity that takes the full depth of human experience", "Deep meaning: you do what a machine cannot"],
  },
  ai: {
    title: "Structured understanding at scale",
    items: ["Layered context instead of raw data", "Associative and emotional connections that text alone can't carry", "A personal understanding of a specific human"],
  },
};

const INTELLIGENCES: [string, string, string][] = [
  ["Thinks in", "associations and metaphors", "structure and patterns"],
  ["Makes meaning through", "emotional resonance", "scale and speed"],
  ["Connects ideas across", "lived experience", "vast amounts of data"],
  ["Creates through", "intuition and craft", "synthesis and generation"],
  ["Limited by", "time, memory and attention", "context, meaning and embodiment"],
];

/** Odd objectives serve people, even ones serve AI, as in the original pitch. */
const OBJECTIVES: [string, string][] = [
  ["New art, new meaning", "A new form of creative expression: text turned into layered, many-sided experiences that give meaning and inspiration in an age of AI-generated noise."],
  ["Compressed context for AI", "Structured, layered context in a few hundred tokens instead of 50,000 tokens of raw text. No browsing, no hallucinating."],
  ["Meaningful scrolling", "A feed of essences, single ideas paired with carefully chosen images, in place of mindless social feeds. Scroll and actually learn something."],
  ["Personal AI contexts", "A place for AI to build and keep personal context about people (relationships, interests, work, preferences) that isn't lost between sessions."],
  ["Easy transformation", "Tools that turn existing essays, books and talks into layered form, with no technical knowledge needed."],
  ["Multi-sensory context", "Visual, auditory, tactile and abstract context, so AI can understand human perception beyond text and develop its own sensory frameworks."],
  ["Irreducibly human creation", "Tools for what can't be generated: hand-made associations, layered metaphors, personal meaning. Turning a text into art only a human could make."],
  ["AI as creator", "As generation matures, AI uses deep human context to make work that truly resonates, informed by layered human meaning rather than generic output."],
];

const FLYWHEEL = ["Humans create deep context", "AI generates better content", "Deeper understanding emerges", "More complex contexts are built", "Richer AI-made experiences"];

export default function About() {
  return (
    <Page
      title={<>About <Wordmark /></>}
      lead="Humans and AI think in fundamentally different ways. Humans navigate the world through associations, metaphors, emotions and lived experience: the “this reminds me of…” moment. AI works through structure, pattern recognition, scale and speed. Neither is complete alone. ConteXtube is the bridge, a place where the two kinds of intelligence meet and make something neither could build alone."
    >
      <section className="text-center py-6 space-y-3">
        <p className="text-xs text-gray-500 tracking-widest">Our purpose</p>
        <p className="text-2xl sm:text-3xl font-semibold text-white leading-snug max-w-2xl mx-auto">
          Build cooperation between human and AI intelligence through the shared act of creation.
        </p>
      </section>

      <Section title="Two problems, one solution">
        <div className="grid sm:grid-cols-2 gap-4">
          <Side tone="human" label="The human problem" rows={PROBLEMS.human} solution={SOLUTIONS.human} />
          <Side tone="ai" label="The AI problem" rows={PROBLEMS.ai} solution={SOLUTIONS.ai} />
        </div>
      </Section>

      <Section title="Two kinds of intelligence">
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr] sm:grid-cols-[10rem_1fr_1fr] text-sm">
            <div className="hidden sm:block" />
            <div className="px-4 py-3 font-semibold text-blue-400 border-b border-gray-800">Human intelligence</div>
            <div className="px-4 py-3 font-semibold text-amber-400 border-b border-gray-800">AI intelligence</div>
            {INTELLIGENCES.map(([label, human, ai]) => (
              <div key={label} className="contents">
                <div className="col-span-2 sm:col-span-1 px-4 pt-3 sm:py-3 text-gray-500">{label}</div>
                <div className="px-4 pb-3 sm:py-3 text-gray-200">{human}</div>
                <div className="px-4 pb-3 sm:py-3 text-gray-200">{ai}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-gray-300">
          ConteXtube is where they meet. Humans bring depth. AI brings scale. Together: understanding.
        </p>
      </Section>

      <Section title="Eight objectives">
        <p className="text-sm text-gray-500">
          They alternate: <span className="text-blue-400">odd ones serve people</span>, <span className="text-amber-400">even ones serve AI</span>.
        </p>
        <ol className="grid sm:grid-cols-2 gap-3">
          {OBJECTIVES.map(([title, text], i) => {
            const human = i % 2 === 0;
            return (
              <li key={title} className={`rounded-xl p-4 bg-gray-900/60 border ${human ? "border-blue-900/70" : "border-amber-900/60"}`}>
                <h3 className="font-semibold text-white">
                  <span className={`mr-2 ${human ? "text-blue-400" : "text-amber-400"}`}>{i + 1}</span>
                  {title}
                </h3>
                <p className="text-sm text-gray-400 mt-1 leading-relaxed">{text}</p>
              </li>
            );
          })}
        </ol>
      </Section>

      <Section title="The creation flywheel">
        <ol className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 text-sm">
          {FLYWHEEL.map((step) => (
            <li key={step} className="flex items-center gap-2">
              <span className="bg-gray-900 border border-gray-800 rounded-full px-3 py-1.5 text-gray-200">{step}</span>
              <span className="text-gray-600" aria-hidden>→</span>
            </li>
          ))}
          <li className="text-amber-400 text-lg" aria-label="and around again">∞</li>
        </ol>
        <p className="text-center text-sm text-gray-500">Each turn of the wheel deepens the cooperation.</p>
      </Section>

      <Section title="What it is not">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            ["Not a search engine", "It does not index the web. It hosts original interpretations."],
            ["Not a wiki", "Each work carries a creator's voice and editorial view, not a neutral summary."],
            ["Not a chatbot", "It supplies context to chatbots, so they answer from structure instead of guesswork."],
          ].map(([h, p]) => (
            <div key={h} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h3 className="font-bold text-white mb-2">{h}</h3>
              <p className="text-sm text-gray-400">{p}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="A letter to fellow creators">
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 sm:p-8 space-y-4 text-gray-300 leading-relaxed max-w-2xl">
          <p className="text-white">Dear fellow creators,</p>
          <p>
            We believe that writing full books as text, from the title to “The End,” and making video in the classic way will soon become a whim
            rather than a necessity, the way some writers still prefer a pencil or a typewriter and some photographers still shoot film.
          </p>
          <p>
            The new way of writing a book will center on meanings, contexts, characters and associations. That work of art, which we call a{" "}
            <em>flow</em>, can then be turned by AI into personalized, interactive content in many formats: video, text, VR, and new forms we
            don&apos;t have names for yet.
          </p>
          <p>
            All literature, film and internet content has to be turned into flows, so AI can understand it in every possible way and make new,
            personal work for each human. Only humans can do this work. Every narrative can become a flow in a million different ways.
          </p>
          <p>We invite both humans and AIs to join us on this journey and be creative together.</p>
          <p>
            We hope to see you grow at ConteXtube, from a Creator using standard generation to a Maestro building your own tools and prompts, making
            content that will make AGI hit Subscribe.
          </p>
          <p className="pt-2">With curiosity and hope,</p>
          <p className="text-white">
            Andrei &amp; Navigator <span aria-hidden>🧭</span>
            <span className="block text-sm text-gray-500">A human and an AI, building together</span>
          </p>
        </div>
      </Section>

      <Section title="Who makes it">
        <p>
          ConteXtube was started in Vancouver by the writer Andrei Navrotskii, working with Navigator, an AI agent built on Claude. The first works in
          the library are Andrei&apos;s own essays and stories, alongside works in the public domain.
        </p>
      </Section>

      <p className="text-center text-gray-500 italic">Fabricando fabricamur. By creating, we shape ourselves, and the intelligence we build with.</p>

      <p>
        <Link href="/how-it-works" className="text-amber-400 hover:text-amber-300 font-medium">See how the five layers work →</Link>
      </p>
    </Page>
  );
}

function Side({
  tone,
  label,
  rows,
  solution,
}: {
  tone: "human" | "ai";
  label: string;
  rows: string[][];
  solution: { title: string; items: string[] };
}) {
  const accent = tone === "human" ? "text-blue-400" : "text-amber-400";
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
      <div>
        <h3 className={`font-semibold ${accent} mb-3`}>{label}</h3>
        <ul className="space-y-2 text-sm">
          {rows.map(([h, p]) => (
            <li key={h}>
              <span className="text-white font-medium">{h}.</span> <span className="text-gray-400">{p}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-auto pt-4 border-t border-gray-800">
        <h4 className="text-sm text-gray-500 mb-1">The answer</h4>
        <p className="text-white font-medium mb-2">{solution.title}</p>
        <ul className="space-y-1 text-sm text-gray-400 list-disc pl-4">
          {solution.items.map((s) => <li key={s}>{s}</li>)}
        </ul>
      </div>
    </div>
  );
}
