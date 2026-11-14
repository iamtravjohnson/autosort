import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const WORKFLOW_PATH = '.github/workflows/update-autosort.yml';

/**
 * Links for one-click updates. Deploy to Vercel doesn't copy a repository's .github folder, so
 * the Update AutoSort workflow ships in updater/ and this builds a GitHub "new file" link that
 * adds it, prefilled. Vercel exposes the repository through its system environment variables.
 */
export async function updateLinks(): Promise<{ setupUrl: string; runUrl: string; repoUrl: string } | null> {
  const owner = process.env.VERCEL_GIT_REPO_OWNER;
  const repo = process.env.VERCEL_GIT_REPO_SLUG;
  if (!owner || !repo || process.env.VERCEL_GIT_PROVIDER !== 'github') return null;
  const repoUrl = `https://github.com/${owner}/${repo}`;
  let workflow: string;
  try {
    workflow = await readFile(join(process.cwd(), 'updater/update-autosort.yml'), 'utf8');
  } catch {
    return null;
  }
  const branch = process.env.VERCEL_GIT_COMMIT_REF || 'main';
  const setupUrl = `${repoUrl}/new/${encodeURIComponent(branch)}?${new URLSearchParams({ filename: WORKFLOW_PATH, value: workflow })}`;
  return { setupUrl, runUrl: `${repoUrl}/actions/workflows/update-autosort.yml`, repoUrl };
}
