/**
 * API route: /api/workspace/files
 * Lists files in the workspace
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectRoot, dirPath } = body;

    if (!projectRoot) {
      return NextResponse.json(
        { error: 'Missing projectRoot' },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Call AIBuilder.listDirectory(dirPath)
    // 2. Return validated file tree
    // 3. Never expose paths outside sandbox

    return NextResponse.json({
      files: [],
      directories: [],
    });
  } catch (error) {
    console.error('Files error:', error);
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    );
  }
}
