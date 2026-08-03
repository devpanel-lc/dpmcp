import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { config } from '../config.js';

interface CreateProfile {
  verified?: boolean;
  payload: Record<string, unknown>;
}

export async function loadCreateProfile(): Promise<CreateProfile> {
  const profilePath = resolve(process.cwd(), `config/create-profiles/${config.createProfile}.json`);
  try {
    return JSON.parse(await readFile(profilePath, 'utf8')) as CreateProfile;
  } catch {
    throw new Error(`Create profile ${config.createProfile} not found or invalid at ${profilePath}. Capture a successful DevPanel UI create request/response and save it as a verified profile.`);
  }
}

export async function assertRealCreateReady(): Promise<void> {
  if (config.mode !== 'real') return;
  if (!config.enableRealCreate) {
    throw new Error('Real CREATE is disabled. Set DP_ENABLE_REAL_CREATE=true and mark the create profile verified before planning a real create. To verify: capture a successful DevPanel UI create request/response into config/create-profiles/' + config.createProfile + '.json and set "verified": true.');
  }
  const profile = await loadCreateProfile();
  if (!profile.verified) {
    throw new Error(`Create profile ${config.createProfile} is not verified. Capture a successful DevPanel UI create request/response into config/create-profiles/${config.createProfile}.json and set "verified": true before enabling real CREATE.`);
  }
}

export function assertRealCreateInput(input: { repositoryId?: string | number }): void {
  if (config.mode !== 'real') return;
  if (!input.repositoryId) {
    throw new Error('repositoryId is required for a real CREATE plan. Get it from devpanel_list_repositories (GitRepoRef.id) and pass it to devpanel_plan_create_application.');
  }
}
