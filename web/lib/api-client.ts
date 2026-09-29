/**
 * API routes for AIBuilder integration
 * These endpoints would connect to the real secure AIBuilder engine
 */

export async function getWorkspaceStatus(projectRoot: string) {
  try {
    const response = await fetch('/api/workspace/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectRoot }),
    });
    return response.json();
  } catch (error) {
    console.error('Failed to get workspace status:', error);
    throw error;
  }
}

export async function listWorkspaceFiles(projectRoot: string) {
  try {
    const response = await fetch('/api/workspace/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectRoot }),
    });
    return response.json();
  } catch (error) {
    console.error('Failed to list workspace files:', error);
    throw error;
  }
}

export async function executeCommand(
  projectRoot: string,
  program: string,
  args: string[],
  description: string
) {
  try {
    const response = await fetch('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectRoot,
        program,
        args,
        description,
      }),
    });
    return response.json();
  } catch (error) {
    console.error('Failed to execute command:', error);
    throw error;
  }
}

export async function readFile(
  projectRoot: string,
  filePath: string
) {
  try {
    const response = await fetch('/api/files/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectRoot, filePath }),
    });
    return response.json();
  } catch (error) {
    console.error('Failed to read file:', error);
    throw error;
  }
}

export async function writeFile(
  projectRoot: string,
  filePath: string,
  content: string
) {
  try {
    const response = await fetch('/api/files/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectRoot, filePath, content }),
    });
    return response.json();
  } catch (error) {
    console.error('Failed to write file:', error);
    throw error;
  }
}
