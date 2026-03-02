import { NextRequest, NextResponse } from 'next/server';
import { startPipelineExecution } from '@/core/pipeline-executor';
import type { ArtifactState } from '@/core/artifact-state.schema';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { runId, state } = (await req.json()) as { runId?: string; state?: ArtifactState };
    if (!runId || !state) {
      return NextResponse.json({ error: 'Missing runId or state' }, { status: 400 });
    }

    startPipelineExecution(runId, state);
    return NextResponse.json({ runId, status: 'started' });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
