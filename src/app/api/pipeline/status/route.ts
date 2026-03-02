import { NextRequest, NextResponse } from 'next/server';
import { isPipelineComplete } from '@/core/orchestrator-state-init';
import { getPipelineState } from '@/core/state-store';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const runId = req.nextUrl.searchParams.get('runId');
  if (!runId) return NextResponse.json({ error: 'Missing runId' }, { status: 400 });

  const state = getPipelineState(runId);
  if (!state) return NextResponse.json({ error: 'Run not found' }, { status: 404 });

  return NextResponse.json({
    runId,
    state,
    complete: isPipelineComplete(state),
    pipelineStatus: state.orchestrationPlan.pipelineStatus,
  });
}
