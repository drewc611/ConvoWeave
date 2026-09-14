# ConvoWeave AWS production stack

This stack provisions the production-shaped infrastructure for ConvoWeave account sync and the remote MCP service.

## What it creates

- Amazon Cognito User Pool with managed OAuth login
- authorization-code grant for public clients
- ConvoWeave resource-server scopes (`convoweave/read`, `convoweave/write`)
- DynamoDB thread index with point-in-time recovery
- private S3 bucket for encrypted account/thread snapshots
- ECR repository with immutable tags and image scanning
- least-privilege App Runner runtime role
- App Runner ECR access role
- optional App Runner service after a container image is supplied

The MCP service uses Cognito access-token `client_id` as its configured audience check. This matches Cognito user access tokens without requiring a circular dependency on the App Runner-generated hostname. Read/write authorization still comes from Cognito custom scopes.

## Why S3 + DynamoDB

A complete thread snapshot can exceed DynamoDB's item-size limit as meeting history grows. DynamoDB stores the per-user thread index and summary metadata. The complete source-backed snapshot is stored as a private encrypted S3 object. Private Sidecar content remains excluded by the application contract.

## Prerequisites

- an AWS account and credentials allowed to create the resources in this directory
- Terraform 1.8+
- Docker
- a unique Cognito domain prefix
- real OAuth callback URLs before user login testing
- a canonical HTTPS origin for final ChatGPT/Claude marketplace configuration

No AWS credentials, OAuth client secrets, tokens, meeting data, or Terraform state should be committed to this repository.

## Phase 1: bootstrap identity, storage and registry

Copy the example variables outside source control and set your callback URLs:

```bash
cd infra/aws
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
```

Leave `container_image_identifier` and `public_base_url` empty for the bootstrap apply. Terraform will create Cognito, DynamoDB, S3, IAM and ECR but will not create App Runner yet.

Capture these outputs:

- `ecr_repository_url`
- `cognito_public_client_id`
- `cognito_authorize_url`
- `cognito_token_url`
- `cognito_issuer`
- `read_scope`
- `write_scope`

## Phase 2: build and push the MCP service

Authenticate Docker to the ECR registry, build the existing MCP container and push an immutable release tag:

```bash
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
docker build -f integrations/mcp/Dockerfile -t convoweave-mcp:<release> .
docker tag convoweave-mcp:<release> <ecr_repository_url>:<release>
docker push <ecr_repository_url>:<release>
```

Set `container_image_identifier` in your tfvars to that exact image tag or digest.

## Phase 3: choose the canonical public origin

For a production marketplace listing, use a stable HTTPS hostname you control, for example `https://mcp.example.com`, as `public_base_url`. Create the App Runner service with that value, then associate the same custom domain with App Runner and complete its DNS validation in your DNS provider.

For a short-lived preview using App Runner's generated hostname, create the service with a temporary canonical value, read `apprunner_service_url`, then immediately update `public_base_url` to the generated HTTPS origin and apply again before OAuth/MCP testing. Do not publish a marketplace integration while metadata points to a temporary or mismatched origin.

```bash
terraform plan
terraform apply
```

The deployed container receives only configuration, resource names and the Cognito public client ID. AWS credentials come from the App Runner instance role.

## OAuth behavior

The Cognito app client uses authorization code flow. Public clients should use PKCE. The service validates JWT signature, issuer, expiry, `client_id`, and configured scopes.

Requested API scopes:

- `convoweave/read`
- `convoweave/write`

Cognito returns refresh tokens for authorization-code grants. The service does not receive or persist the user's refresh token; the calling mobile/ChatGPT/Claude client owns its token lifecycle.

## ChatGPT / Claude

Point both integrations at the same public endpoint:

```text
https://<public-origin>/mcp
```

OAuth protected-resource discovery is available at:

```text
https://<public-origin>/.well-known/oauth-protected-resource
```

Register the final redirect URIs supplied by each platform in Cognito before marketplace/review testing. The repository deliberately does not invent those account-specific redirect URIs.

## Data deletion

Deleting a synced thread removes its DynamoDB index record and the corresponding S3 snapshot object. S3 versioning is intentionally not enabled in this v1 stack so an application-level delete does not leave ordinary historical object versions behind. AWS backup/log retention and any legal retention policy must be documented separately before public launch.

## Production checklist

Before public launch:

- configure final domain/DNS
- register final OAuth redirect URIs
- run the MCP OAuth flow end-to-end from ChatGPT and Claude
- connect the mobile app's authorization-code/PKCE client
- configure monitoring/alerts and budget controls
- verify account export/deletion behavior
- publish support/privacy URLs
- review data retention and subprocessor disclosures
