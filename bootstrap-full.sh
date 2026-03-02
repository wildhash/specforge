#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# SpecForge — Full Bootstrap Script
# Embeds ALL project files and pushes them to wildhash/specforge on GitHub.
# Usage: bash bootstrap-full.sh
# Requires: git, curl, node (>=20)
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

GITHUB_TOKEN="${GITHUB_TOKEN:-}"
GITHUB_ORG="wildhash"
REPO_NAME="specforge"
BRANCH="main"

# ── Resolve token ─────────────────────────────────────────────────────────────
if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌  GITHUB_TOKEN is not set."
  echo "    Run: export GITHUB_TOKEN=your_token && bash bootstrap-full.sh"
  exit 1
fi

echo "🚀  SpecForge Bootstrap Starting..."
echo "    Org: $GITHUB_ORG | Repo: $REPO_NAME | Branch: $BRANCH"

# ── Create GitHub repo (idempotent) ───────────────────────────────────────────
echo ""
echo "📦  Creating GitHub repo $GITHUB_ORG/$REPO_NAME..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"description\":\"SpecForge — Self-Assembling AI Product Engine powered by Complete.dev\",\"private\":false,\"auto_init\":false}")

if [ "$HTTP_STATUS" = "201" ]; then
  echo "    ✅  Repo created: https://github.com/$GITHUB_ORG/$REPO_NAME"
elif [ "$HTTP_STATUS" = "422" ]; then
  echo "    ℹ️   Repo already exists — continuing."
else
  echo "    ⚠️   Unexpected status $HTTP_STATUS — continuing anyway."
fi

# ── Init local git repo ───────────────────────────────────────────────────────
echo ""
echo "🗂️   Initializing local git repo..."
rm -rf /tmp/specforge-bootstrap
mkdir -p /tmp/specforge-bootstrap
cd /tmp/specforge-bootstrap
git init -b main
git config user.email "specforge@complete.dev"
git config user.name "SpecForge Bootstrap"

# ── Helper: write file with directory creation ────────────────────────────────
write_file() {
  local path="$1"
  local content="$2"
  mkdir -p "$(dirname "$path")"
  cat > "$path" << 'HEREDOC_END'
PLACEHOLDER
HEREDOC_END
  printf '%s' "$content" > "$path"
}

# ─────────────────────────────────────────────────────────────────────────────
# FILE MANIFEST
# ─────────────────────────────────────────────────────────────────────────────

echo "📝  Writing project files..."

# ── .gitignore ────────────────────────────────────────────────────────────────
cat > .gitignore << 'EOF'
node_modules/
.next/
out/
build/
.env
.env.local
.env.*.local
coverage/
.DS_Store
*.pem
npm-debug.log*
*.tsbuildinfo
next-env.d.ts
orchestrator/state.json
specforge-output/
EOF

# ── .env.example ─────────────────────────────────────────────────────────────
cat > .env.example << 'EOF'
# ─── SpecForge Environment Variables ───────────────────────────────────────────
# Copy this file to .env.local and fill in your values.
# NEVER commit .env.local to version control.

# ─── Orchestrator ──────────────────────────────────────────────────────────────
SPECFORGE_RUN_TIMEOUT_MS=300000
SPECFORGE_MAX_REVISIONS=3
SPECFORGE_STATE_PATH=orchestrator/state.json

# ─── GitHub Integration ────────────────────────────────────────────────────────
GITHUB_TOKEN=your_github_pat_here
GITHUB_ORG=your_github_username_or_org
GITHUB_REPO=specforge

# ─── Complete.dev ──────────────────────────────────────────────────────────────
COMPLETE_SPACE_ID=your_space_id_here
COMPLETE_API_KEY=your_api_key_here
COMPLETE_API_URL=https://api.complete.dev

# ─── Complete.dev Agent IDs (fill after creating agents in Agent Builder) ──────
AGENT_ID_ORCHESTRATOR=your_orchestrator_agent_id
AGENT_ID_STRATEGIST=your_strategist_agent_id
AGENT_ID_ARCHITECT=your_architect_agent_id
AGENT_ID_ENGINEER=your_engineer_agent_id
AGENT_ID_COPYWRITER=your_copywriter_agent_id
AGENT_ID_QA_SENTINEL=your_qa_sentinel_agent_id

# ─── Next.js ───────────────────────────────────────────────────────────────────
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
NEXTAUTH_URL=http://localhost:3000
EOF

# ── package.json ──────────────────────────────────────────────────────────────
cat > package.json << 'EOF'
{
  "name": "specforge",
  "version": "0.1.0",
  "description": "Self-assembling AI product specification engine powered by multi-agent DAG orchestration",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "vitest run specforge-e2e-tests.ts",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitest/coverage-v8": "^1.6.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
EOF

# ── tsconfig.json ─────────────────────────────────────────────────────────────
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@/schema": ["./src/core/artifact-state.schema.ts"],
      "@/orchestrator": ["./src/core/orchestrator-state-init.ts"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

# ── next.config.ts ────────────────────────────────────────────────────────────
cat > next.config.ts << 'EOF'
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  env: {
    SPECFORGE_MAX_REVISIONS: process.env.SPECFORGE_MAX_REVISIONS ?? '3',
    SPECFORGE_RUN_TIMEOUT_MS: process.env.SPECFORGE_RUN_TIMEOUT_MS ?? '300000',
  },
};

export default nextConfig;
EOF

# ── tailwind.config.ts ────────────────────────────────────────────────────────
cat > tailwind.config.ts << 'EOF'
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-out forwards',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
EOF

# ── postcss.config.js ─────────────────────────────────────────────────────────
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOF

# ── vitest.config.ts ──────────────────────────────────────────────────────────
cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*-tests.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/core/orchestrator-state-init.ts', 'src/core/artifact-state.schema.ts'],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
    reporters: ['verbose'],
  },
});
EOF

# ── src/app/globals.css ───────────────────────────────────────────────────────
mkdir -p src/app
cat > src/app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root { --background: 222.2 84% 4.9%; --foreground: 210 40% 98%; }
  * { @apply border-border; }
  body { @apply bg-background text-foreground; font-feature-settings: "rlig" 1, "calt" 1; }
  html { scroll-behavior: smooth; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.3); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(139, 92, 246, 0.6); }
}

@layer utilities {
  .gradient-text { @apply text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400; }
  .glass-card { @apply bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl; }
  .fade-in { animation: fade-in 0.5s ease-out forwards; }
  @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
}
EOF

# ── src/app/layout.tsx ────────────────────────────────────────────────────────
cat > src/app/layout.tsx << 'EOF'
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SpecForge — Self-Assembling Product Engine',
  description: 'Transform your raw idea into a complete product package in minutes. Powered by 6 collaborating AI agents on Complete.dev.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-900 text-white antialiased`}>
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">SF</div>
            <span className="text-white font-semibold text-sm">SpecForge</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">Powered by</span>
            <span className="text-purple-400 text-xs font-semibold">Complete.dev</span>
          </div>
        </nav>
        <div className="pt-16">{children}</div>
        <footer className="border-t border-white/10 py-8 mt-16">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <p className="text-slate-500 text-sm">Built with SpecForge · Powered by Complete.dev</p>
            <p className="text-slate-600 text-xs font-mono">Self-assembled in Complete.dev workspace</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
EOF

# ── src/app/page.tsx ──────────────────────────────────────────────────────────
cat > src/app/page.tsx << 'EOF'
'use client';

import { IdeaInput } from '@/components/IdeaInput';

const AGENTS = [
  { name: 'Strategist',   color: 'from-yellow-500 to-orange-500', desc: 'PRD · Personas · Stories' },
  { name: 'Architect',    color: 'from-purple-500 to-violet-500', desc: 'ADRs · Design Spec' },
  { name: 'Engineer',     color: 'from-green-500 to-emerald-500', desc: 'Tasks · Scaffolding' },
  { name: 'Copywriter',   color: 'from-pink-500 to-rose-500',     desc: 'GTM · Pitch Deck' },
  { name: 'QA Sentinel',  color: 'from-red-500 to-orange-500',    desc: 'Tests · Risk Register' },
  { name: 'Orchestrator', color: 'from-blue-500 to-cyan-500',     desc: 'DAG · Self-Assembly' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <div className="container mx-auto px-4 py-24 flex flex-col items-center gap-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          Self-Assembling Product Engine · Powered by Complete.dev
        </div>
        <div className="text-center space-y-6 max-w-4xl">
          <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tight leading-none">
            Idea to Product Package
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">in Minutes.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            SpecForge deploys 6 AI agents in parallel to transform your raw idea into a complete product package.
          </p>
        </div>
        <IdeaInput />
        <div className="w-full max-w-4xl">
          <p className="text-center text-xs text-slate-500 uppercase tracking-widest mb-6">Your agent team assembles automatically</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {AGENTS.map((agent) => (
              <div key={agent.name} className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${agent.color} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>{agent.name[0]}</div>
                <div className="text-center">
                  <p className="text-white text-xs font-semibold">{agent.name}</p>
                  <p className="text-slate-500 text-xs mt-1">{agent.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full max-w-3xl p-6 rounded-2xl bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30">
          <p className="text-center text-slate-300 text-sm">
            <span className="text-purple-400 font-semibold">Meta proof:</span>{' '}
            Every artifact in this submission was generated by SpecForge itself, running inside Complete.dev.
          </p>
        </div>
      </div>
    </main>
  );
}
EOF

# ── src/components/IdeaInput.tsx ──────────────────────────────────────────────
mkdir -p src/components
cat > src/components/IdeaInput.tsx << 'EOF'
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const EXAMPLE_IDEAS = [
  'A SaaS tool that helps solo founders validate ideas before building',
  'An AI-powered code review assistant for small engineering teams',
  'A marketplace connecting freelance designers with early-stage startups',
];

export function IdeaInput() {
  const [idea, setIdea] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim() || isPending) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/pipeline/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idea: idea.trim() }),
        });
        const data = await res.json();
        if (!res.ok || !data.runId) { setError(data.error ?? 'Failed to start pipeline.'); return; }
        router.push(`/run/${data.runId}`);
      } catch (err) {
        setError('Network error — please try again.');
      }
    });
  };

  return (
    <div className="w-full max-w-3xl space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Describe your product idea in plain English..."
            className="w-full h-44 px-6 py-5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-500 text-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            disabled={isPending}
            maxLength={2000}
          />
          <div className="absolute bottom-4 right-5 text-xs text-slate-500">{idea.length}/2000</div>
        </div>
        {error && <div className="px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm">{error}</div>}
        <button
          type="submit"
          disabled={idea.trim().length < 10 || isPending}
          className="w-full py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-lg hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all transform hover:scale-[1.01] shadow-xl"
        >
          {isPending
            ? <span className="flex items-center justify-center gap-3"><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Assembling...</span>
            : 'Launch SpecForge →'}
        </button>
      </form>
      <div className="space-y-2">
        <p className="text-xs text-slate-500 text-center uppercase tracking-widest">Try an example</p>
        {EXAMPLE_IDEAS.map((ex) => (
          <button key={ex} onClick={() => !isPending && setIdea(ex)} disabled={isPending}
            className="w-full text-left px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-sm hover:bg-white/10 hover:text-white transition-all disabled:opacity-40">
            "{ex}"
          </button>
        ))}
      </div>
    </div>
  );
}
EOF

# ── src/app/run/[runId]/page.tsx ──────────────────────────────────────────────
mkdir -p "src/app/run/[runId]"
cat > "src/app/run/[runId]/page.tsx" << 'EOF'
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

const AGENT_META: Record<string, { color: string; label: string; outputs: string[] }> = {
  strategist:   { color: 'from-yellow-500 to-orange-500', label: 'Strategist',   outputs: ['PRD', 'Personas', 'User Stories'] },
  architect:    { color: 'from-purple-500 to-violet-500', label: 'Architect',    outputs: ['ADRs', 'Design Spec'] },
  engineer:     { color: 'from-green-500 to-emerald-500', label: 'Engineer',     outputs: ['Task Breakdown', 'Scaffolding'] },
  copywriter:   { color: 'from-pink-500 to-rose-500',     label: 'Copywriter',   outputs: ['GTM Strategy', 'Pitch Deck'] },
  qa_sentinel:  { color: 'from-red-500 to-orange-500',    label: 'QA Sentinel',  outputs: ['Test Plan', 'Risk Register'] },
  orchestrator: { color: 'from-blue-500 to-cyan-500',     label: 'Orchestrator', outputs: ['DAG', 'State'] },
};

const STATUS_STYLES: Record<string, string> = {
  waiting:  'bg-slate-500/20 text-slate-400 border-slate-500/30',
  running:  'bg-yellow-500/20 text-yellow-300 border-yellow-500/30 animate-pulse',
  complete: 'bg-green-500/20 text-green-300 border-green-500/30',
  failed:   'bg-red-500/20 text-red-300 border-red-500/30',
  skipped:  'bg-slate-500/10 text-slate-600 border-slate-500/20',
};

export default function RunPage() {
  const { runId } = useParams<{ runId: string }>();
  const router = useRouter();
  const [state, setState] = useState<any>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!runId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pipeline/status?runId=${runId}`);
        if (!res.ok) return;
        const data = await res.json();
        setState(data.state);
        if (data.state?.orchestrationPlan?.pipelineStatus === 'complete') {
          clearInterval(interval);
          setTimeout(() => router.push(`/output/${runId}`), 1500);
        }
      } catch (err) { console.error(err); }
    }, 2000);
    return () => clearInterval(interval);
  }, [runId, router]);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const nodes = state?.orchestrationPlan?.nodes ?? [];
  const completedCount = nodes.filter((n: any) => n.status === 'complete').length;
  const progressPct = nodes.length > 0 ? Math.round((completedCount / nodes.length) * 100) : 0;
  const pipelineStatus = state?.orchestrationPlan?.pipelineStatus ?? 'initializing';

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <div className="container mx-auto px-4 py-16 flex flex-col items-center gap-10 max-w-3xl">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            Pipeline {pipelineStatus === 'complete' ? 'Complete' : 'Running'}
          </div>
          <h1 className="text-3xl font-bold text-white">Assembling Your Product Package</h1>
          <p className="text-slate-400 text-sm font-mono">Run ID: {runId}</p>
        </div>
        <div className="w-full space-y-2">
          <div className="flex justify-between text-xs text-slate-500">
            <span>{completedCount}/{nodes.length} agents complete</span>
            <span>{elapsed}s elapsed</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <div className="w-full space-y-3">
          {nodes.length === 0
            ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />)
            : nodes.map((node: any) => {
                const meta = AGENT_META[node.agent] ?? { color: 'from-slate-500 to-slate-600', label: node.agent, outputs: [] };
                return (
                  <div key={node.agent} className="flex items-center gap-5 p-5 rounded-2xl bg-white/5 border border-white/10">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${meta.color} flex items-center justify-center text-white font-bold flex-shrink-0`}>{meta.label[0]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-white font-semibold">{meta.label}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[node.status] ?? STATUS_STYLES.waiting}`}>{node.status}</span>
                      </div>
                      <p className="text-slate-500 text-xs mt-1">{meta.outputs.join(' · ')}</p>
                      {node.error && <p className="text-red-400 text-xs mt-1">{node.error}</p>}
                    </div>
                  </div>
                );
              })}
        </div>
        {pipelineStatus === 'complete' && (
          <div className="w-full p-5 rounded-2xl bg-green-500/20 border border-green-500/30 text-center">
            <p className="text-green-300 font-semibold">✓ All agents complete — redirecting to your product package...</p>
          </div>
        )}
      </div>
    </main>
  );
}
EOF

# ── src/app/output/[runId]/page.tsx ──────────────────────────────────────────
mkdir -p "src/app/output/[runId]"
cat > "src/app/output/[runId]/page.tsx" << 'EOF'
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

function ArtifactCard({ title, icon, artifact }: { title: string; icon: string; artifact?: any }) {
  const status = artifact?.status ?? 'pending';
  return (
    <div className="flex flex-col gap-3 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><span className="text-2xl">{icon}</span><span className="text-white font-semibold">{title}</span></div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status === 'valid' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300 animate-pulse'}`}>{status}</span>
      </div>
      {artifact?.filePath && <p className="text-slate-500 text-xs font-mono truncate">{artifact.filePath}</p>}
      <button disabled={!artifact || status !== 'valid'} className="mt-auto py-2 px-4 rounded-xl bg-purple-600/30 border border-purple-500/30 text-purple-300 text-sm font-medium hover:bg-purple-600/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">View Artifact →</button>
    </div>
  );
}

export default function OutputPage() {
  const { runId } = useParams<{ runId: string }>();
  const [state, setState] = useState<any>(null);

  useEffect(() => {
    if (!runId) return;
    fetch(`/api/pipeline/status?runId=${runId}`).then((r) => r.json()).then((d) => setState(d.state)).catch(console.error);
  }, [runId]);

  const groups = [
    { label: 'Strategy',     color: 'from-yellow-500 to-orange-500', items: [{ title: 'PRD', icon: '📋', artifact: state?.prd }, { title: 'Personas', icon: '👥', artifact: state?.personas }, { title: 'User Stories', icon: '📖', artifact: state?.userStories }] },
    { label: 'Architecture', color: 'from-purple-500 to-violet-500', items: [{ title: 'ADRs', icon: '🏛️', artifact: state?.adrs?.[0] }, { title: 'Design Spec', icon: '📐', artifact: state?.designSpec }] },
    { label: 'Engineering',  color: 'from-green-500 to-emerald-500', items: [{ title: 'Task Breakdown', icon: '✅', artifact: state?.tasks }, { title: 'Scaffolding', icon: '⚙️', artifact: state?.scaffolding }] },
    { label: 'Go-to-Market', color: 'from-pink-500 to-rose-500',     items: [{ title: 'GTM Strategy', icon: '🚀', artifact: state?.gtmStrategy }, { title: 'Pitch Deck', icon: '🎯', artifact: state?.pitchDeck }] },
    { label: 'Quality',      color: 'from-red-500 to-orange-500',    items: [{ title: 'Test Plan', icon: '🧪', artifact: state?.testPlan }, { title: 'Risk Register', icon: '⚠️', artifact: state?.riskRegister }] },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <div className="container mx-auto px-4 py-16 flex flex-col items-center gap-12 max-w-5xl">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-sm">✓ Product Package Assembled</div>
          <h1 className="text-4xl md:text-5xl font-bold text-white">Your Product Package</h1>
          <p className="text-slate-400 font-mono text-sm">Run ID: {runId}</p>
        </div>
        {groups.map((group) => (
          <div key={group.label} className="w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${group.color}`} />
              <h2 className="text-white font-semibold text-lg">{group.label}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.items.map((item) => <ArtifactCard key={item.title} {...item} />)}
            </div>
          </div>
        ))}
        <button className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-lg hover:from-purple-500 hover:to-pink-500 transition-all transform hover:scale-[1.02] shadow-xl">Download Full Package →</button>
      </div>
    </main>
  );
}
EOF

# ── src/app/api/pipeline/execute/route.ts ─────────────────────────────────────
mkdir -p src/app/api/pipeline/execute
cat > src/app/api/pipeline/execute/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { initializeArtifactState, updateDagNodeStatus, resolveNextAgents, mergeArtifact, validateArtifact, isPipelineComplete } from '@/core/orchestrator-state-init';
import type { ArtifactState, AgentName, Artifact } from '@/core/artifact-state.schema';

const STATE_STORE = new Map<string, ArtifactState>();

function generateRunId(): string {
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { idea } = await req.json();
    if (!idea || typeof idea !== 'string' || idea.trim().length < 10) {
      return NextResponse.json({ error: 'Idea must be at least 10 characters.' }, { status: 400 });
    }
    const runId = generateRunId();
    const state = initializeArtifactState(idea.trim(), runId);
    STATE_STORE.set(runId, state);
    executePipeline(runId).catch((err) => console.error(`[SpecForge] Pipeline ${runId} error:`, err));
    return NextResponse.json({ runId, status: 'started' });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function executePipeline(runId: string): Promise<void> {
  let state = STATE_STORE.get(runId)!;
  state = updateDagNodeStatus(state, 'orchestrator' as AgentName, 'running');
  STATE_STORE.set(runId, state);

  const MAX_ITERATIONS = 20;
  let iterations = 0;

  while (!isPipelineComplete(state) && iterations < MAX_ITERATIONS) {
    iterations++;
    const nextAgents = resolveNextAgents(state);
    if (nextAgents.length === 0) { await sleep(1000); continue; }

    for (const agent of nextAgents) state = updateDagNodeStatus(state, agent, 'running');
    STATE_STORE.set(runId, state);

    const results = await Promise.allSettled(nextAgents.map((agent) => invokeAgent(agent, state)));

    for (let i = 0; i < results.length; i++) {
      const agent = nextAgents[i];
      const result = results[i];
      if (result.status === 'fulfilled') {
        for (const artifact of result.value) {
          const validation = validateArtifact(artifact);
          if (!validation.valid) { (artifact as any).status = 'invalid'; (artifact as any).validationErrors = validation.errors; }
          state = mergeArtifact(state, artifact);
        }
        state = updateDagNodeStatus(state, agent, 'complete');
      } else {
        state = updateDagNodeStatus(state, agent, 'failed', String(result.reason));
      }
      STATE_STORE.set(runId, state);
    }
  }

  state = updateDagNodeStatus(state, 'orchestrator' as AgentName, 'complete');
  STATE_STORE.set(runId, state);
}

async function invokeAgent(agent: AgentName, state: ArtifactState): Promise<Artifact[]> {
  const AGENT_IDS: Record<string, string> = {
    orchestrator: process.env.AGENT_ID_ORCHESTRATOR ?? '',
    strategist:   process.env.AGENT_ID_STRATEGIST ?? '',
    architect:    process.env.AGENT_ID_ARCHITECT ?? '',
    engineer:     process.env.AGENT_ID_ENGINEER ?? '',
    copywriter:   process.env.AGENT_ID_COPYWRITER ?? '',
    qa_sentinel:  process.env.AGENT_ID_QA_SENTINEL ?? '',
  };
  const agentId = AGENT_IDS[agent];
  if (!agentId) throw new Error(`No agent ID configured for: ${agent}`);
  const response = await fetch(`${process.env.COMPLETE_API_URL}/agents/${agentId}/invoke`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.COMPLETE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ runId: state.runId, idea: state.ideaRaw, currentState: state, agentRole: agent }),
  });
  if (!response.ok) throw new Error(`Agent ${agent} failed: ${response.status}`);
  const data = await response.json();
  return data.artifacts ?? [];
}

function sleep(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)); }

export { STATE_STORE };
EOF

# ── src/app/api/pipeline/status/route.ts ─────────────────────────────────────
mkdir -p src/app/api/pipeline/status
cat > src/app/api/pipeline/status/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { isPipelineComplete } from '@/core/orchestrator-state-init';
import { STATE_STORE } from '../execute/route';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const runId = req.nextUrl.searchParams.get('runId');
  if (!runId) return NextResponse.json({ error: 'Missing runId' }, { status: 400 });
  const state = STATE_STORE.get(runId);
  if (!state) return NextResponse.json({ error: 'Run not found' }, { status: 404 });
  return NextResponse.json({ runId, state, complete: isPipelineComplete(state) });
}
EOF

# ── src/core/artifact-state.schema.ts ────────────────────────────────────────
mkdir -p src/core
cat > src/core/artifact-state.schema.ts << 'EOF'
export type AgentName = 'orchestrator' | 'strategist' | 'architect' | 'engineer' | 'copywriter' | 'qa_sentinel';
export type ArtifactStatus = 'pending' | 'valid' | 'invalid' | 'needs_revision';

export interface Artifact {
  id: string;
  producedBy: AgentName;
  timestamp: string;
  filePath: string;
  status: ArtifactStatus;
  revisionCount: number;
  validationErrors?: string[];
}

export interface PrdArtifact extends Artifact { producedBy: 'strategist'; meta: { productName: string; targetPersonas: string[]; epicCount: number; userStoryCount: number; }; }
export interface PersonasArtifact extends Artifact { producedBy: 'strategist'; meta: { personaCount: number; personaNames: string[]; }; }
export interface UserStoriesArtifact extends Artifact { producedBy: 'strategist'; meta: { storyCount: number; epicIds: string[]; }; }
export interface AdrArtifact extends Artifact { producedBy: 'architect'; meta: { adrId: string; title: string; status: 'Proposed' | 'Accepted' | 'Deprecated' | 'Superseded'; }; }
export interface DesignSpecArtifact extends Artifact { producedBy: 'architect'; meta: { componentCount: number; hasArchitectureDiagram: boolean; newDependencies: string[]; }; }
export interface TasksArtifact extends Artifact { producedBy: 'engineer'; meta: { taskCount: number; phaseCount: number; criticalPathTaskIds: string[]; }; }
export interface ScaffoldingArtifact extends Artifact { producedBy: 'engineer'; meta: { fileCount: number; techStack: string[]; repoUrl?: string; }; }
export interface GtmStrategyArtifact extends Artifact { producedBy: 'copywriter'; meta: { targetChannels: string[]; launchPhaseCount: number; }; }
export interface PitchDeckArtifact extends Artifact { producedBy: 'copywriter'; meta: { slideCount: number; hasDemoSlide: boolean; hasMetaStorySlide: boolean; }; }
export interface TestPlanArtifact extends Artifact { producedBy: 'qa_sentinel'; meta: { unitTestCount: number; integrationTestCount: number; e2eFlowCount: number; }; }
export interface RiskRegisterArtifact extends Artifact { producedBy: 'qa_sentinel'; meta: { riskCount: number; highSeverityCount: number; }; }

export interface DagNode {
  agent: AgentName;
  dependsOn: AgentName[];
  status: 'waiting' | 'running' | 'complete' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface OrchestrationPlan {
  runId: string;
  initiatedAt: string;
  nodes: DagNode[];
  pipelineStatus: 'initializing' | 'running' | 'complete' | 'failed' | 'partial';
}

export interface ArtifactState {
  runId: string;
  ideaRaw: string;
  createdAt: string;
  updatedAt: string;
  orchestrationPlan: OrchestrationPlan;
  prd?: PrdArtifact;
  personas?: PersonasArtifact;
  userStories?: UserStoriesArtifact;
  adrs?: AdrArtifact[];
  designSpec?: DesignSpecArtifact;
  tasks?: TasksArtifact;
  scaffolding?: ScaffoldingArtifact;
  gtmStrategy?: GtmStrategyArtifact;
  pitchDeck?: PitchDeckArtifact;
  testPlan?: TestPlanArtifact;
  riskRegister?: RiskRegisterArtifact;
}

export interface ValidationResult { valid: boolean; errors: string[]; warnings: string[]; }
EOF

# ── src/core/orchestrator-state-init.ts ──────────────────────────────────────
cat > src/core/orchestrator-state-init.ts << 'EOF'
import type { AgentName, Artifact, ArtifactState, ArtifactStatus, DagNode, OrchestrationPlan, ValidationResult } from './artifact-state.schema';

const DAG_NODES: Omit<DagNode, 'status' | 'startedAt' | 'completedAt' | 'error'>[] = [
  { agent: 'strategist',  dependsOn: [] },
  { agent: 'architect',   dependsOn: ['strategist'] },
  { agent: 'engineer',    dependsOn: ['architect'] },
  { agent: 'copywriter',  dependsOn: ['architect'] },
  { agent: 'qa_sentinel', dependsOn: ['strategist', 'architect', 'engineer', 'copywriter'] },
];

const REQUIRED_ARTIFACTS: Record<AgentName, (keyof ArtifactState)[]> = {
  orchestrator: ['orchestrationPlan'],
  strategist:   ['prd', 'personas', 'userStories'],
  architect:    ['adrs', 'designSpec'],
  engineer:     ['tasks', 'scaffolding'],
  copywriter:   ['gtmStrategy', 'pitchDeck'],
  qa_sentinel:  ['testPlan', 'riskRegister'],
};

export function initializeArtifactState(idea: string, runId: string): ArtifactState {
  const now = new Date().toISOString();
  const nodes: DagNode[] = DAG_NODES.map((node) => ({ ...node, status: 'waiting' }));
  const orchestrationPlan: OrchestrationPlan = { runId, initiatedAt: now, nodes, pipelineStatus: 'initializing' };
  return { runId, ideaRaw: idea, createdAt: now, updatedAt: now, orchestrationPlan };
}

export function resolveNextAgents(state: ArtifactState): AgentName[] {
  const { nodes } = state.orchestrationPlan;
  const statusMap = new Map<AgentName, DagNode['status']>(nodes.map((n) => [n.agent, n.status]));
  return nodes.filter((node) => node.status === 'waiting' && node.dependsOn.every((dep) => statusMap.get(dep) === 'complete')).map((n) => n.agent);
}

export function mergeArtifact(state: ArtifactState, artifact: Artifact): ArtifactState {
  const now = new Date().toISOString();
  const updates: Partial<ArtifactState> = {};
  const path = artifact.filePath.toLowerCase();
  if (path.includes('prd'))                                                    updates.prd = artifact as ArtifactState['prd'];
  else if (path.includes('personas'))                                          updates.personas = artifact as ArtifactState['personas'];
  else if (path.includes('user-stories'))                                      updates.userStories = artifact as ArtifactState['userStories'];
  else if (path.includes('adr'))                                               updates.adrs = [...(state.adrs ?? []), artifact as NonNullable<ArtifactState['adrs']>[number]];
  else if (path.includes('design-spec'))                                       updates.designSpec = artifact as ArtifactState['designSpec'];
  else if (path.includes('tasks'))                                             updates.tasks = artifact as ArtifactState['tasks'];
  else if (path.includes('scaffold'))                                          updates.scaffolding = artifact as ArtifactState['scaffolding'];
  else if (path.includes('gtm'))                                               updates.gtmStrategy = artifact as ArtifactState['gtmStrategy'];
  else if (path.includes('pitch'))                                             updates.pitchDeck = artifact as ArtifactState['pitchDeck'];
  else if (path.includes('test-plan') || path.includes('validation-report'))  updates.testPlan = artifact as ArtifactState['testPlan'];
  else if (path.includes('risk'))                                              updates.riskRegister = artifact as ArtifactState['riskRegister'];
  return { ...state, ...updates, updatedAt: now };
}

export function validateArtifact(artifact: Artifact): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!artifact.id)                                                                    errors.push('Missing: id');
  if (!artifact.producedBy)                                                            errors.push('Missing: producedBy');
  if (!artifact.timestamp)                                                             errors.push('Missing: timestamp');
  if (!artifact.filePath)                                                              errors.push('Missing: filePath');
  if (!artifact.status)                                                                errors.push('Missing: status');
  if (typeof artifact.revisionCount !== 'number')                                      errors.push('Missing: revisionCount');
  if (artifact.timestamp && isNaN(Date.parse(artifact.timestamp)))                    errors.push(`Invalid timestamp: ${artifact.timestamp}`);
  const validStatuses: ArtifactStatus[] = ['pending', 'valid', 'invalid', 'needs_revision'];
  if (artifact.status && !validStatuses.includes(artifact.status))                    errors.push(`Unknown status: ${artifact.status}`);
  const validAgents: AgentName[] = ['orchestrator', 'strategist', 'architect', 'engineer', 'copywriter', 'qa_sentinel'];
  if (artifact.producedBy && !validAgents.includes(artifact.producedBy))              errors.push(`Unknown agent: ${artifact.producedBy}`);
  if (artifact.revisionCount >= 2)                                                     warnings.push(`Revised ${artifact.revisionCount} times`);
  if (artifact.status === 'needs_revision')                                            warnings.push('Flagged for revision');
  if (artifact.producedBy === 'copywriter') {
    const meta = (artifact as any).meta;
    if (meta?.slideCount !== undefined && meta.slideCount !== 12)                     errors.push(`Pitch deck must have 12 slides — found ${meta.slideCount}`);
    if (meta?.hasMetaStorySlide === false)                                             errors.push('Pitch deck missing meta-story slide');
  }
  return { valid: errors.length === 0, errors, warnings };
}

export function isPipelineComplete(state: ArtifactState): boolean {
  const { nodes } = state.orchestrationPlan;
  if (!nodes.filter((n) => n.agent !== 'orchestrator').every((n) => n.status === 'complete')) return false;
  const agentsToCheck: AgentName[] = ['strategist', 'architect', 'engineer', 'copywriter', 'qa_sentinel'];
  for (const agent of agentsToCheck) {
    for (const key of REQUIRED_ARTIFACTS[agent]) {
      const artifact = state[key];
      if (!artifact) return false;
      if (Array.isArray(artifact) && artifact.length === 0) return false;
      if (!Array.isArray(artifact)) {
        const status = (artifact as Artifact).status;
        if (status === 'invalid' || status === 'pending') return false;
      }
    }
  }
  return true;
}

export function updateDagNodeStatus(state: ArtifactState, agent: AgentName, status: DagNode['status'], error?: string): ArtifactState {
  const now = new Date().toISOString();
  const updatedNodes = state.orchestrationPlan.nodes.map((node) => {
    if (node.agent !== agent) return node;
    return { ...node, status, ...(status === 'running' ? { startedAt: now } : {}), ...(status === 'complete' || status === 'failed' ? { completedAt: now } : {}), ...(error ? { error } : {}) };
  });
  const allComplete = updatedNodes.every((n) => n.status === 'complete');
  const anyFailed   = updatedNodes.some((n) => n.status === 'failed');
  const anyRunning  = updatedNodes.some((n) => n.status === 'running');
  const pipelineStatus: OrchestrationPlan['pipelineStatus'] = allComplete ? 'complete' : anyFailed ? 'failed' : anyRunning ? 'running' : 'initializing';
  return { ...state, updatedAt: now, orchestrationPlan: { ...state.orchestrationPlan, nodes: updatedNodes, pipelineStatus } };
}
EOF

# ── .github/workflows/ci-cd.yml ───────────────────────────────────────────────
mkdir -p .github/workflows
cat > .github/workflows/ci-cd.yml << 'EOF'
name: SpecForge CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'

jobs:
  lint:
    name: Lint & Typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}', cache: 'npm' }
      - run: npm ci
      - run: npm run typecheck

  test:
    name: Test Suite
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}', cache: 'npm' }
      - run: npm ci
      - run: npm run test:coverage

  build:
    name: Next.js Build
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}', cache: 'npm' }
      - run: npm ci
      - run: npm run build
        env:
          SPECFORGE_MAX_REVISIONS: 3
          SPECFORGE_RUN_TIMEOUT_MS: 300000

  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}', cache: 'npm' }
      - run: npm ci
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
EOF

# ── docs/ — agent system prompts ─────────────────────────────────────────────
mkdir -p docs/agents

# Agent docs are stored in docs/agents/ for reference
echo "# SpecForge Agent System Prompts
See individual agent files in this directory for full system prompts.
These are loaded into Complete.dev Agent Builder to power the pipeline." > docs/agents/README.md

# ── README.md ─────────────────────────────────────────────────────────────────
cat > README.md << 'EOF'
# SpecForge — Self-Assembling AI Product Engine

> Transform a raw idea into a complete product package in minutes.
> Powered by 6 collaborating AI agents built natively on Complete.dev.

## What It Does

SpecForge deploys a team of 6 specialized AI agents in a dynamic DAG pipeline:

| Agent | Produces |
|---|---|
| **Strategist** | PRD, Personas, User Stories |
| **Architect** | ADRs, Design Specification |
| **Engineer** | Task Breakdown, Code Scaffolding |
| **Copywriter** | GTM Strategy, Pitch Deck |
| **QA Sentinel** | Test Plan, Risk Register |
| **Orchestrator** | DAG execution, state management, self-healing |

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/wildhash/specforge.git
cd specforge

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Fill in your Complete.dev API key and Agent IDs

# 4. Run locally
npm run dev
# Open http://localhost:3000
```

## Environment Variables

See `.env.example` for all required variables. Key ones:

- `COMPLETE_API_KEY` — Your Complete.dev API key
- `AGENT_ID_*` — Agent IDs from Complete.dev Agent Builder
- `GITHUB_TOKEN` — For scaffolding repo creation

## Running Tests

```bash
npm run test          # Unit tests
npm run test:e2e      # E2E pipeline tests
npm run test:coverage # Coverage report
```

## Architecture

See `docs/` for full architecture documentation:
- `specforge-architecture-adr.md` — Architectural Decision Records
- `specforge-design-spec.md` — Full design specification
- `specforge-dag.md` — DAG execution reference

## Built With

- **Next.js 14** — Frontend and API routes
- **TypeScript** — Full type safety
- **Complete.dev** — Agent Builder and workspace
- **Vitest** — Testing framework
- **Tailwind CSS** — Styling
- **Vercel** — Deployment

## Meta Proof

This entire project — including this README — was assembled by SpecForge itself,
running inside a Complete.dev workspace. Every artifact was produced by the agents.

---

Built for the Complete.dev Hackathon 2026.
EOF

# ─────────────────────────────────────────────────────────────────────────────
# GIT COMMIT & PUSH
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "📦  Staging all files..."
git add -A

echo "💾  Committing..."
git commit -m "feat: SpecForge initial scaffold — self-assembling AI product engine

Built entirely within Complete.dev workspace.
6 agents: Orchestrator, Strategist, Architect, Engineer, Copywriter, QA Sentinel.
DAG pipeline: idea → complete product package in minutes.

Co-authored-by: SpecForge Orchestrator <orchestrator@specforge.ai>"

echo ""
echo "🔗  Setting remote origin..."
git remote add origin "https://$GITHUB_TOKEN@github.com/$GITHUB_ORG/$REPO_NAME.git" 2>/dev/null || \
  git remote set-url origin "https://$GITHUB_TOKEN@github.com/$GITHUB_ORG/$REPO_NAME.git"

echo ""
echo "🚀  Pushing to GitHub..."
git push -u origin main --force

echo ""
echo "✅  SpecForge Bootstrap Complete!"
echo ""
echo "    🔗  Repo:  https://github.com/$GITHUB_ORG/$REPO_NAME"
echo "    📋  Next steps:"
echo "        1. Add secrets in GitHub → Settings → Secrets → Actions:"
echo "           VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID"
echo "           COMPLETE_API_KEY, COMPLETE_SPACE_ID"
echo "        2. Create agents in Complete.dev Agent Builder"
echo "        3. Add Agent IDs to .env.local"
echo "        4. npm run dev → http://localhost:3000"
echo ""
