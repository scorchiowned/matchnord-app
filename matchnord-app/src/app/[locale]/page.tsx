import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to MatchNord
        </h1>
        <p className="text-xl text-gray-600 mb-8">Tournament Platform</p>
        <Link href="/fi/tournaments">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            View Tournaments
          </button>
        </Link>
      </div>
    </div>
  );
}
