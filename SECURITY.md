# Security Policy

ConvoWeave is proprietary software. Please do not disclose suspected vulnerabilities publicly.

## Reporting a vulnerability

Report suspected security issues privately to the repository owner through GitHub's private vulnerability reporting feature when enabled. Do not open a public issue containing exploit details, credentials, recordings, transcripts, personal information, or other sensitive data.

Include, when possible:

- affected version or commit
- reproduction steps
- expected and observed behavior
- security impact
- suggested mitigation

## Supported code

Security fixes target the latest supported production release and the active development branch.

## Secrets

Never commit API keys, signing keys, service-account JSON files, Apple credentials, Google Play credentials, Expo access tokens, certificates, provisioning profiles, `.env` files, or customer meeting content.

## Meeting data

Raw audio, transcripts, evidence references, private notes, and generated meeting memory must be treated as sensitive user data. Private notes must not enter shared AI context unless the user explicitly promotes them.
