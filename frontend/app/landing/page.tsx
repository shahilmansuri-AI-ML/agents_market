export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold text-indigo-600 mb-8">Agents Market</h1>
        <p className="text-2xl text-zinc-600 mb-8">Multi-Tenant AI Platform</p>
        <p className="text-lg text-zinc-600 mb-8">
          Enterprise-grade AI agent orchestration platform with complete IAM,
          multi-tenancy, and workflow automation. Deploy autonomous agents in minutes.
        </p>
        <div className="flex gap-4 justify-center">
          <a href="/signup" className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
            Start Free Trial
          </a>
          <a href="/login" className="border border-zinc-300 px-6 py-3 rounded-lg hover:bg-zinc-50">
            Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
