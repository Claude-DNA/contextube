import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-32 pb-24 text-center space-y-4">
      <h1 className="text-3xl font-bold">Nothing at this address</h1>
      <p className="text-gray-400">The page or work may have moved or been unpublished.</p>
      <p className="text-sm">
        <Link href="/explore" className="text-blue-400 hover:text-blue-300">Search the library</Link>
        <span className="text-gray-600"> · </span>
        <Link href="/" className="text-blue-400 hover:text-blue-300">Back to the feed</Link>
      </p>
    </div>
  );
}
