# ADR 0010: AWS production hosting and account storage

## Status
Accepted for production deployment v1.

## Context
ConvoWeave's authenticated MCP/account-sync service needs a public HTTPS endpoint, a production OAuth/OIDC issuer, durable per-user storage, and a deployment model that does not embed cloud credentials in application code.

The account snapshot API permits thread state that can grow beyond DynamoDB's 400 KB item limit, so storing a complete thread snapshot in one DynamoDB item is not safe for real meeting histories.

## Decision
The initial AWS production architecture is:

- **AWS App Runner** for the public containerized MCP/account-sync service and managed HTTPS ingress;
- **Amazon Cognito User Pools** for authorization-code/PKCE OAuth and OIDC access tokens;
- a Cognito resource server with namespaced read/write scopes;
- **DynamoDB** for the per-user thread index and summary metadata;
- **Amazon S3** for complete encrypted thread snapshots;
- **Amazon ECR** for immutable/scanned container images;
- App Runner instance roles for AWS API access instead of static AWS credentials;
- Terraform for repeatable provisioning.

The service derives account ownership from verified OIDC issuer + subject. DynamoDB partition keys use the existing one-way hash of that identity. S3 object keys use the hashed account key plus a hash of the thread id.

Cognito access tokens expose the app client as `client_id`; ConvoWeave therefore supports a configurable OIDC audience claim and uses `client_id` for this deployment. API authorization remains enforced with configured custom scopes (`convoweave/read` and `convoweave/write`).

## Storage semantics
A thread update writes the encrypted S3 snapshot before updating its DynamoDB index record. A delete removes the S3 object and DynamoDB record. Bucket versioning is not enabled in v1 so ordinary application deletion does not retain prior user snapshot versions.

DynamoDB point-in-time recovery is enabled for index durability. Operational backup and legal-retention policy for account content must be explicitly defined before public launch.

## Deployment sequence
Infrastructure is intentionally two-phase:

1. bootstrap Cognito, storage, IAM and ECR;
2. build and push the MCP container, then create App Runner with the immutable image identifier and canonical public HTTPS origin.

Final DNS/custom-domain ownership and OAuth callback registration are deployment/account-holder actions and are not stored in source control.

## Consequences
The same MCP service can serve the mobile app, ChatGPT and Claude using one identity/storage boundary. The application remains portable because account-store behavior is still behind the existing storage interface.
