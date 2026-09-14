output "ecr_repository_url" {
  description = "Push the MCP container image to this ECR repository before the second apply."
  value       = aws_ecr_repository.mcp.repository_url
}

output "account_table_name" {
  value = aws_dynamodb_table.account_threads.name
}

output "account_snapshot_bucket" {
  value = aws_s3_bucket.account_snapshots.id
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.this.id
}

output "cognito_public_client_id" {
  value = aws_cognito_user_pool_client.public.id
}

output "cognito_issuer" {
  value = local.cognito_issuer
}

output "cognito_jwks_url" {
  value = local.cognito_jwks_url
}

output "cognito_authorize_url" {
  value = "https://${aws_cognito_user_pool_domain.this.domain}.auth.${var.aws_region}.amazoncognito.com/oauth2/authorize"
}

output "cognito_token_url" {
  value = "https://${aws_cognito_user_pool_domain.this.domain}.auth.${var.aws_region}.amazoncognito.com/oauth2/token"
}

output "read_scope" {
  value = local.read_scope
}

output "write_scope" {
  value = local.write_scope
}

output "apprunner_service_url" {
  description = "Generated App Runner URL when container_image_identifier is set."
  value       = try("https://${aws_apprunner_service.mcp[0].service_url}", null)
}

output "configured_mcp_url" {
  description = "Canonical MCP endpoint based on public_base_url."
  value       = var.public_base_url == "" ? null : "${trimsuffix(var.public_base_url, "/")}/mcp"
}
