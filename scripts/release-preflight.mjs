import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

function findExpoAudioPlugin(plugins = []) {
  for (const plugin of plugins) {
    if (plugin === 'expo-audio') return { name: 'expo-audio', options: {} };
    if (Array.isArray(plugin) && plugin[0] === 'expo-audio') return { name: 'expo-audio', options: plugin[1] ?? {} };
  }
  return null;
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function evaluateReleaseConfig(app, eas, env = {}, { requireEasProject = false } = {}) {
  const errors = [];
  const warnings = [];
  const expo = app?.expo ?? {};

  if (expo.name !== 'ConvoWeave') errors.push('Expo app name must be ConvoWeave.');
  if (expo.slug !== 'convoweave') errors.push('Expo slug must be convoweave.');
  if (!/^\d+\.\d+\.\d+$/.test(String(expo.version ?? ''))) errors.push('Expo version must use x.y.z semantic versioning.');
  if (expo.ios?.bundleIdentifier !== 'com.convoweave.mobile') errors.push('iOS bundleIdentifier must be com.convoweave.mobile.');
  if (expo.android?.package !== 'com.convoweave.mobile') errors.push('Android package must be com.convoweave.mobile.');

  const audioPlugin = findExpoAudioPlugin(expo.plugins);
  if (!audioPlugin) {
    errors.push('expo-audio plugin must be configured.');
  } else {
    if (!String(audioPlugin.options?.microphonePermission ?? '').trim()) errors.push('Microphone permission copy must be configured.');
    if (audioPlugin.options?.enableBackgroundRecording !== false) errors.push('Background recording must remain disabled for the current release.');
  }

  const preview = eas?.build?.preview;
  if (preview?.distribution !== 'internal') errors.push('EAS preview profile must use internal distribution.');
  if (preview?.environment !== 'preview') errors.push('EAS preview profile must use the preview environment.');

  const production = eas?.build?.production;
  if (production?.environment !== 'production') errors.push('EAS production profile must use the production environment.');
  if (production?.autoIncrement !== true) errors.push('EAS production profile must auto-increment build versions.');

  const androidSubmit = eas?.submit?.production?.android;
  if (androidSubmit?.track !== 'internal') errors.push('Initial Android production submissions must target the internal track.');
  if (androidSubmit?.releaseStatus !== 'draft') errors.push('Initial Android production submissions must remain draft.');

  const easProjectId = expo?.extra?.eas?.projectId;
  if (!easProjectId) {
    const message = 'Expo/EAS project is not connected yet. Run eas init with the account holder before an EAS build.';
    if (requireEasProject) errors.push(message);
    else warnings.push(message);
  }

  const appEnv = env.EXPO_PUBLIC_APP_ENV?.trim();
  const processingMode = env.EXPO_PUBLIC_PROCESSING_MODE?.trim();
  const apiUrl = env.EXPO_PUBLIC_API_URL?.trim();
  if (appEnv && !['development', 'preview', 'production'].includes(appEnv)) errors.push('EXPO_PUBLIC_APP_ENV is invalid.');
  if (processingMode && !['local', 'remote'].includes(processingMode)) errors.push('EXPO_PUBLIC_PROCESSING_MODE is invalid.');
  if (processingMode === 'remote') {
    if (!apiUrl) errors.push('EXPO_PUBLIC_API_URL is required for remote processing.');
    else if (!isHttpsUrl(apiUrl)) errors.push('Remote processing API URL must use HTTPS for internal/release builds.');
  }

  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith('EXPO_PUBLIC_') || !String(value ?? '').trim()) continue;
    if (/(TOKEN|SECRET|API_KEY|PASSWORD|PRIVATE_KEY)/i.test(key)) {
      errors.push(`${key} looks like a secret and must not be exposed through EXPO_PUBLIC_*.`);
    }
  }

  return { errors, warnings };
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function main() {
  const app = await readJson('app.json');
  const eas = await readJson('eas.json');
  const requireEasProject = process.argv.includes('--connected');
  const result = evaluateReleaseConfig(app, eas, process.env, { requireEasProject });

  for (const warning of result.warnings) console.warn(`WARN: ${warning}`);
  for (const error of result.errors) console.error(`FAIL: ${error}`);
  if (result.errors.length > 0) process.exitCode = 1;
  else console.info('PASS: ConvoWeave release configuration preflight passed.');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await main();
}
