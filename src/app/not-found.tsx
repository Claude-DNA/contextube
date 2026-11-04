import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty">
      <h1>Nothing at this address</h1>
      <p className="lede">The page or work may have moved or been unpublished.</p>
      <p><Link href="/explore">Search the library</Link> or go back to the <Link href="/">feed</Link>.</p>
    </div>
  );
}
