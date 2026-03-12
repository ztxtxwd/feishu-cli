import {
  chmodSync,
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { getConfigDir, readConfig, writeConfig } from "./config.js";
import type { Credentials, Profile } from "./types.js";

const CREDENTIALS_FILE = "credentials.json";

function getCredentialsPath(): string {
  return join(getConfigDir(), CREDENTIALS_FILE);
}

function loadCredentials(): Credentials {
  const credPath = getCredentialsPath();
  if (!existsSync(credPath)) {
    return { profiles: {} };
  }
  return JSON.parse(readFileSync(credPath, "utf-8"));
}

function saveCredentials(credentials: Credentials): void {
  const credPath = getCredentialsPath();
  writeFileSync(credPath, JSON.stringify(credentials, null, 2));
  chmodSync(credPath, 0o600);
}

export function addProfile(profile: Profile): void {
  const credentials = loadCredentials();
  credentials.profiles[profile.name] = profile;
  saveCredentials(credentials);

  const config = readConfig();
  if (!config.activeProfile) {
    config.activeProfile = profile.name;
    writeConfig(config);
  }
}

export function removeProfile(name: string): boolean {
  const credentials = loadCredentials();

  if (!credentials.profiles[name]) {
    return false;
  }

  delete credentials.profiles[name];
  saveCredentials(credentials);

  const config = readConfig();
  if (config.activeProfile === name) {
    const remaining = Object.keys(credentials.profiles);
    config.activeProfile = remaining.length > 0 ? remaining[0] : null;
    writeConfig(config);
  }

  return true;
}

export function getProfile(name: string): Profile | null {
  const credentials = loadCredentials();
  return credentials.profiles[name] ?? null;
}

export function listProfiles(): Profile[] {
  const credentials = loadCredentials();
  return Object.values(credentials.profiles);
}

export function getActiveProfile(): Profile | null {
  const config = readConfig();
  if (!config.activeProfile) {
    return null;
  }
  return getProfile(config.activeProfile);
}
