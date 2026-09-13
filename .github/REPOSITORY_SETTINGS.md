# Required Repository Settings

These settings complement the files already committed to the repository.

## Visibility

Set the repository to **Private** before proprietary implementation details are considered confidential. The proprietary license restricts use of public source, but it does not prevent public reading of a public repository.

## Main branch ruleset

Create a ruleset targeting `main` with these controls:

- require a pull request before merging
- require at least 1 approval
- dismiss stale approvals when new commits are pushed
- require review from CODEOWNERS
- require conversation resolution
- block force pushes
- block branch deletion
- require status checks before merge
- do not allow bypass except the repository owner for emergency recovery

Required checks once their workflows have completed successfully:

- `Mobile CI / validate`
- `CodeQL / Analyze JavaScript / TypeScript`
- `Dependency Review / dependency-review`

Prefer squash merging for normal feature work so `main` remains readable.

## Security settings

Enable where available for the repository/plan:

- Dependency graph
- Dependabot alerts
- Dependabot security updates
- Code scanning / CodeQL
- Secret scanning
- Push protection for detected secrets
- Private vulnerability reporting

If the repository is made private and GitHub Code Security / Advanced Security is not available, keep `npm audit` in Mobile CI and disable only the GitHub features that the plan cannot run.

## Actions settings

- Default workflow token permission: **Read repository contents**
- Permit write permissions only in workflows that explicitly need them
- Require approval for workflows from first-time external contributors if external contributions are ever accepted
- Prefer GitHub-authored, verified publisher, or explicitly reviewed actions
- Do not place long-lived store credentials in workflow files

## Release credentials

Do not commit these values:

- Expo access token
- Apple ID password
- App Store Connect API private key
- Apple signing certificate or provisioning profile
- Google Play service-account JSON key
- Android upload keystore or passwords

Use EAS credential storage / connections and store-console credential systems instead.

## Production release control

Until the product is ready for public release, keep store workflows manually triggered. Production submission should require a deliberate release action after tests, privacy declarations, screenshots, and store metadata are current.
