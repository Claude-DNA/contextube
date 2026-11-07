/** Text-page shell from the original site: max-w-4xl, big bold title, grey lead, sections with white headings. */
export function Page({ title, lead, children }: { title: React.ReactNode; lead?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="max-w-4xl mx-auto px-6 pt-28 pb-16">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">{title}</h1>
        {lead && <p className="text-lg text-gray-400 leading-relaxed">{lead}</p>}
      </div>
      {children}
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
      <div className="space-y-4 text-gray-300 leading-relaxed">{children}</div>
    </section>
  );
}

export function Code({ children }: { children: React.ReactNode }) {
  return <code className="bg-gray-800 px-1.5 py-0.5 rounded text-sm text-blue-300">{children}</code>;
}

export function Pre({ children }: { children: string }) {
  return <pre className="bg-gray-900 border border-gray-800 rounded-lg p-4 overflow-x-auto text-sm text-gray-300">{children}</pre>;
}

export function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto border border-gray-800 rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-gray-900 text-gray-400">
          <tr>{head.map((h) => <th key={h} className="text-left font-semibold px-4 py-2.5">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-gray-800 align-top">
              {r.map((cell, j) => <td key={j} className="px-4 py-2.5 text-gray-300">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
