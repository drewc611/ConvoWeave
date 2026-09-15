# ConvoWeave Store Listing

## Shared identity

**Name:** ConvoWeave

**Category:** Productivity

**Positioning:** Meeting memory and decision companion

**Current release candidate:** `0.3.0-alpha.1`

**Bundle/package ID:** `com.convoweave.mobile`

## Public URLs

- Privacy Policy: `https://convoweave-mcp.onrender.com/privacy`
- Support: `https://convoweave-mcp.onrender.com/support`
- Data & account deletion: `https://convoweave-mcp.onrender.com/account-deletion`

These pages are hosted on the existing free ConvoWeave Render service. Re-verify them before each store submission.

## Apple App Store

**Subtitle (30 characters max):**
Meeting memory that connects

**Promotional text:**
Turn meetings into durable memory. Review decisions, commitments, assumptions, and source evidence instead of losing context in another transcript.

**Keywords:**
meetings,notes,decisions,memory,minutes,actions,transcript,productivity,work,recall

**Description:**
ConvoWeave helps you keep the thread across meetings.

Record a meeting when you choose, take notes while you capture, review important information before it becomes durable memory, and keep decisions, commitments, assumptions, contradictions, and supporting evidence connected over time.

ConvoWeave is designed around a simple idea: a meeting should not become an isolated transcript that everyone forgets.

Core experience:
• Explicit, user-controlled meeting recording
• Live meeting notepad
• Meeting Workspace for memory and source context
• Human review before generated meeting memory is accepted
• Decisions kept as durable objects instead of disposable summary text
• What Changed views across meeting state
• Commitments carried forward and surfaced by risk
• Assumptions kept separate from confirmed decisions
• Contradiction review instead of silent conflict resolution
• Source evidence attached to important meeting memory
• Private Sidecar notes kept outside shared context unless explicitly promoted
• Local-first storage in the current release

ConvoWeave is built for people who need to remember not only what was said, but what changed and why.

## Google Play

**App name:**
ConvoWeave

**Short description (80 characters max):**
Connect meetings, decisions and commitments into durable working memory.

**Full description:**
ConvoWeave is a meeting memory and decision companion designed to keep context connected across conversations.

Instead of treating every meeting as a separate transcript, ConvoWeave helps preserve the state of the work: what was decided, what changed, who committed to what, which assumptions still need validation, where contradictions need review, and where important information came from.

Use ConvoWeave to:
• Record meetings explicitly from your phone
• Take notes while a meeting is in progress
• Review proposed meeting memory before accepting it
• Preserve decisions and their supporting evidence
• See what changed between conversations
• Keep commitments visible after the meeting ends
• Separate assumptions from confirmed information
• Review conflicting statements instead of silently overwriting history
• Keep private Sidecar notes out of shared context unless you explicitly promote them
• Carry important context from one conversation to the next

The current release uses a local-first design. Recording begins only when you explicitly start it, and background recording is disabled.

ConvoWeave is for professionals and teams who want their meetings to build useful memory instead of producing another pile of disconnected notes.

## Screenshot plan

Use real runtime captures from the release candidate. Do not imply unavailable cloud/account features.

1. Suite Dashboard: recent meetings, memory state, commitments, decisions, and What Changed
2. Live Capture: recording status plus the meeting notepad
3. Meeting Workspace: memory pane alongside source transcript/context
4. Decision Ledger: durable decisions with evidence/history
5. Commitment Radar: owner, due date, status, and risk
6. What Changed / Contradiction Review: visible state changes and conflicts

The README SVG previews are repository previews, not substitutes for final store screenshots. Final store assets should come from validated runtime builds.

## Review notes

- Microphone access is user initiated and used for meeting recording.
- Background recording is disabled in the current release configuration.
- The normal alpha review path is local/manual.
- Preview-only remote processing is separately gated and requires explicit approval before approved meeting data leaves the device.
- Provider credentials are not embedded in the mobile app.
- Private Sidecar notes are excluded from shared/cloud synchronization boundaries unless explicitly promoted by the user.
- The public MCP preview is stateless with respect to durable ConvoWeave user accounts.
- No reviewer account is required for the local-first alpha. If authenticated account sync is enabled before store submission, update these notes and provide appropriate reviewer access.

## Submission gate

Do not submit a production release until:

- physical-device Critical QA passes on Android and iOS
- signed internal distribution builds exist for both platforms
- App Privacy / Data Safety answers have been revalidated against the exact shipping build
- final runtime screenshots have been captured from the shipping candidate
- Apple/Google account-holder agreements and verification are complete
