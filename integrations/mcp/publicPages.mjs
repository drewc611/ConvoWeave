const styles = `
  :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #07111f; color: #e8eef7; }
  main { max-width: 860px; margin: 0 auto; padding: 56px 24px 80px; }
  a { color: #6ee7f9; }
  h1 { margin: 0 0 10px; font-size: clamp(2rem, 5vw, 3.4rem); line-height: 1.02; }
  h2 { margin-top: 36px; font-size: 1.25rem; }
  p, li { color: #b8c4d6; line-height: 1.65; }
  .eyebrow { color: #6ee7f9; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; font-size: .75rem; }
  .card { margin-top: 26px; padding: 22px; border: 1px solid #23344a; border-radius: 18px; background: #0c1929; }
  .muted { color: #7f91aa; font-size: .92rem; }
  nav { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 34px; padding-top: 22px; border-top: 1px solid #23344a; }
`;

function page(title, description, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="index,follow">
  <meta name="description" content="${description}">
  <title>${title} · ConvoWeave</title>
  <style>${styles}</style>
</head>
<body>
<main>
  <div class="eyebrow">ConvoWeave</div>
  ${body}
  <nav>
    <a href="/privacy">Privacy</a>
    <a href="/support">Support</a>
    <a href="/account-deletion">Data & account deletion</a>
    <a href="https://github.com/drewc611/ConvoWeave">GitHub</a>
  </nav>
</main>
</body>
</html>`;
}

const privacy = page(
  'Privacy Policy',
  'Privacy policy for the ConvoWeave mobile alpha and public MCP preview.',
  `<h1>Privacy Policy</h1>
  <p class="muted">Effective September 14, 2026 · Applies to the ConvoWeave mobile alpha and public MCP preview.</p>

  <div class="card"><strong>Local-first by default.</strong><p>ConvoWeave is designed so meeting capture and durable meeting-memory state remain on the user’s device unless the user deliberately enables a feature that sends data elsewhere.</p></div>

  <h2>Data the mobile alpha can handle</h2>
  <p>Depending on how you use the app, ConvoWeave can handle microphone audio, meeting notes, transcripts, decisions, commitments, assumptions, contradiction records, source evidence, and private Sidecar notes. The current alpha stores its primary meeting state locally on the device.</p>

  <h2>Microphone access</h2>
  <p>Microphone permission is requested for meeting recording. Background recording is disabled in the current release configuration. ConvoWeave does not sell microphone data or use it for advertising.</p>

  <h2>Optional remote processing</h2>
  <p>The alpha’s normal review path is local/manual. Preview-only remote processing can be enabled separately and requires an explicit approval before approved meeting data leaves the device. When a remote processor is enabled, the approved content is sent only for the requested processing flow. Provider credentials are kept outside the mobile bundle.</p>

  <h2>Public MCP preview</h2>
  <p>The public ConvoWeave MCP preview is hosted on Render and currently operates without persistent ConvoWeave account storage. Requests sent to the MCP service are processed to return tool results. The hosting platform may retain ordinary operational metadata such as request timing, IP/network information, and service logs under its own infrastructure policies.</p>

  <h2>Private Sidecar</h2>
  <p>Private Sidecar notes are intentionally excluded from shared/cloud synchronization boundaries unless the user explicitly promotes information out of the private area. The account-sync contract rejects private-note payloads.</p>

  <h2>Sale, advertising, and tracking</h2>
  <p>ConvoWeave does not sell personal data and the current alpha does not contain an advertising network. The project does not use meeting content for behavioral advertising.</p>

  <h2>Retention and deletion</h2>
  <p>Local app data remains on the device until the user removes the relevant content or app data. The public MCP preview does not currently provide durable user-account storage. See the <a href="/account-deletion">Data & account deletion</a> page for the current deletion path.</p>

  <h2>Security</h2>
  <p>The project uses automated dependency checks, secret scanning, CodeQL, release preflight checks, explicit data-boundary tests, and source-evidence rules. No security measure can guarantee absolute protection, so alpha users should avoid placing credentials or unnecessary sensitive information into test meeting content.</p>

  <h2>Children</h2>
  <p>ConvoWeave is a work and meeting-productivity tool and is not directed to children under 13.</p>

  <h2>Changes</h2>
  <p>This policy will be updated before enabling materially different production data practices such as durable cloud account sync or additional production processing providers.</p>

  <h2>Questions</h2>
  <p>Use the <a href="/support">ConvoWeave support page</a> for product, privacy, or release questions. Do not post recordings, transcripts, credentials, or other sensitive meeting content in a public support request.</p>`
);

const support = page(
  'Support',
  'Support information for ConvoWeave.',
  `<h1>Support</h1>
  <p class="muted">ConvoWeave is currently an internal alpha release candidate.</p>

  <div class="card"><strong>Support channel</strong><p>Open a request in the <a href="https://github.com/drewc611/ConvoWeave/issues">ConvoWeave GitHub issue tracker</a>. Describe the problem, app version, platform, and reproduction steps. Never attach real meeting content, credentials, private tokens, or personal data.</p></div>

  <h2>Current release</h2>
  <p>The current release candidate is <strong>0.3.0-alpha.1</strong>. Alpha builds are for validation and are not represented as production-ready App Store or Google Play releases.</p>

  <h2>Useful details for a bug report</h2>
  <ul>
    <li>ConvoWeave version and build number</li>
    <li>iOS or Android version</li>
    <li>Device model</li>
    <li>Exact steps that reproduce the problem</li>
    <li>Whether the problem occurred during recording, review, recovery, or a memory workflow</li>
    <li>A request ID when the app shows one</li>
  </ul>

  <h2>Security issues</h2>
  <p>Do not disclose secrets or exploit details in a public issue. Repository-owner security controls and private vulnerability reporting are tracked as release hardening work.</p>

  <h2>Privacy and deletion</h2>
  <p>Review the <a href="/privacy">Privacy Policy</a> and <a href="/account-deletion">Data & account deletion</a> pages for the current alpha behavior.</p>`
);

const deletion = page(
  'Data & Account Deletion',
  'Data and account deletion information for ConvoWeave.',
  `<h1>Data & Account Deletion</h1>
  <p class="muted">Current behavior for ConvoWeave 0.3.0-alpha.1.</p>

  <div class="card"><strong>No production cloud account is created by the current alpha.</strong><p>The current mobile alpha is local-first. The public MCP preview is stateless with respect to durable ConvoWeave user accounts. Because the current public alpha does not create a persistent ConvoWeave cloud account, there is no production cloud account record to delete.</p></div>

  <h2>Delete local ConvoWeave data</h2>
  <p>Delete meetings or threads through the app where the relevant delete control is available. To remove all locally stored ConvoWeave app data, uninstall the alpha build or clear the app’s storage using the operating system’s app-storage controls.</p>

  <h2>Public MCP preview</h2>
  <p>The current public MCP preview does not use durable ConvoWeave account storage. Ordinary hosting/network logs may still exist temporarily under the infrastructure provider’s operational retention practices.</p>

  <h2>Future account sync</h2>
  <p>The codebase contains authenticated account-sync architecture, but it is not enabled as the public alpha’s production account service. Before persistent account creation is enabled for distributed builds, ConvoWeave will provide an authenticated in-app deletion path and an external deletion-request mechanism, and this page will be updated to describe the production retention timeline.</p>

  <h2>Need help?</h2>
  <p>Use the <a href="/support">support page</a> if the app appears to retain data after you followed the applicable local deletion steps. Do not publish private meeting content in the support request.</p>`
);

export function publicPage(pathname) {
  if (pathname === '/privacy') return privacy;
  if (pathname === '/support') return support;
  if (pathname === '/account-deletion') return deletion;
  return null;
}
