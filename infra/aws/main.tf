locals {
  service_name               = "${var.app_name}-${var.environment}"
  resource_server_identifier = "convoweave"
  read_scope                 = "${local.resource_server_identifier}/read"
  write_scope                = "${local.resource_server_identifier}/write"
  cognito_issuer             = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.this.id}"
  cognito_jwks_url           = "${local.cognito_issuer}/.well-known/jwks.json"
}

resource "aws_dynamodb_table" "account_threads" {
  name         = "${local.service_name}-account-threads"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "AccountKey"
  range_key    = "ThreadId"

  attribute {
    name = "AccountKey"
    type = "S"
  }

  attribute {
    name = "ThreadId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}

resource "aws_s3_bucket" "account_snapshots" {
  bucket_prefix = "${local.service_name}-account-"
}

resource "aws_s3_bucket_public_access_block" "account_snapshots" {
  bucket                  = aws_s3_bucket.account_snapshots.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "account_snapshots" {
  bucket = aws_s3_bucket.account_snapshots.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "account_snapshots" {
  bucket = aws_s3_bucket.account_snapshots.id

  rule {
    id     = "abort-incomplete-uploads"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

data "aws_iam_policy_document" "snapshot_bucket" {
  statement {
    sid    = "DenyInsecureTransport"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions   = ["s3:*"]
    resources = [aws_s3_bucket.account_snapshots.arn, "${aws_s3_bucket.account_snapshots.arn}/*"]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "account_snapshots" {
  bucket     = aws_s3_bucket.account_snapshots.id
  policy     = data.aws_iam_policy_document.snapshot_bucket.json
  depends_on = [aws_s3_bucket_public_access_block.account_snapshots]
}

resource "aws_ecr_repository" "mcp" {
  name                 = "${local.service_name}-mcp"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }
}

resource "aws_ecr_lifecycle_policy" "mcp" {
  repository = aws_ecr_repository.mcp.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep the newest 20 production images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 20
      }
      action = { type = "expire" }
    }]
  })
}

resource "aws_cognito_user_pool" "this" {
  name                     = "${local.service_name}-users"
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
  deletion_protection      = "ACTIVE"

  password_policy {
    minimum_length                   = 12
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = true
    require_uppercase                = true
    temporary_password_validity_days = 3
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  user_attribute_update_settings {
    attributes_require_verification_before_update = ["email"]
  }
}

resource "aws_cognito_resource_server" "convoweave" {
  identifier   = local.resource_server_identifier
  name         = "ConvoWeave API"
  user_pool_id = aws_cognito_user_pool.this.id

  scope {
    scope_name        = "read"
    scope_description = "Read the signed-in user's synced ConvoWeave meeting memory"
  }

  scope {
    scope_name        = "write"
    scope_description = "Create, update, and delete the signed-in user's synced ConvoWeave meeting memory"
  }
}

resource "aws_cognito_user_pool_client" "public" {
  name         = "${local.service_name}-public-client"
  user_pool_id = aws_cognito_user_pool.this.id

  generate_secret                      = false
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile", local.read_scope, local.write_scope]
  callback_urls                        = var.oauth_callback_urls
  logout_urls                          = var.oauth_logout_urls
  supported_identity_providers         = ["COGNITO"]
  enable_token_revocation              = true
  prevent_user_existence_errors        = "ENABLED"
  access_token_validity                = 1
  id_token_validity                    = 1
  refresh_token_validity               = 30

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  depends_on = [aws_cognito_resource_server.convoweave]
}

resource "aws_cognito_user_pool_domain" "this" {
  domain       = var.cognito_domain_prefix
  user_pool_id = aws_cognito_user_pool.this.id
}

data "aws_iam_policy_document" "apprunner_instance_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["tasks.apprunner.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "apprunner_instance" {
  name               = "${local.service_name}-apprunner-instance"
  assume_role_policy = data.aws_iam_policy_document.apprunner_instance_assume.json
}

data "aws_iam_policy_document" "apprunner_data" {
  statement {
    sid = "AccountThreadIndex"
    actions = [
      "dynamodb:DescribeTable",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query"
    ]
    resources = [aws_dynamodb_table.account_threads.arn]
  }

  statement {
    sid       = "AccountSnapshotBucket"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.account_snapshots.arn]
  }

  statement {
    sid       = "AccountSnapshotObjects"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.account_snapshots.arn}/accounts/*"]
  }
}

resource "aws_iam_role_policy" "apprunner_data" {
  name   = "${local.service_name}-account-storage"
  role   = aws_iam_role.apprunner_instance.id
  policy = data.aws_iam_policy_document.apprunner_data.json
}

data "aws_iam_policy_document" "apprunner_ecr_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["build.apprunner.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "apprunner_ecr" {
  name               = "${local.service_name}-apprunner-ecr"
  assume_role_policy = data.aws_iam_policy_document.apprunner_ecr_assume.json
}

resource "aws_iam_role_policy_attachment" "apprunner_ecr" {
  role       = aws_iam_role.apprunner_ecr.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

resource "aws_apprunner_auto_scaling_configuration_version" "this" {
  auto_scaling_configuration_name = "${local.service_name}-autoscaling"
  max_concurrency                 = 50
  max_size                        = 5
  min_size                        = 1
}

resource "aws_apprunner_service" "mcp" {
  count        = var.container_image_identifier == "" ? 0 : 1
  service_name = "${local.service_name}-mcp"

  source_configuration {
    auto_deployments_enabled = false

    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_ecr.arn
    }

    image_repository {
      image_identifier      = var.container_image_identifier
      image_repository_type = "ECR"

      image_configuration {
        port = "8790"
        runtime_environment_variables = {
          NODE_ENV                       = "production"
          HOST                           = "0.0.0.0"
          PORT                           = "8790"
          CONVOWEAVE_MCP_AUTH_MODE       = "oidc"
          CONVOWEAVE_MCP_PUBLIC_BASE_URL = var.public_base_url
          CONVOWEAVE_ACCOUNT_STORE_MODE  = "aws"
          CONVOWEAVE_ACCOUNT_TABLE       = aws_dynamodb_table.account_threads.name
          CONVOWEAVE_ACCOUNT_BUCKET      = aws_s3_bucket.account_snapshots.id
          CONVOWEAVE_READ_SCOPE          = local.read_scope
          CONVOWEAVE_WRITE_SCOPE         = local.write_scope
          OIDC_ISSUER                    = local.cognito_issuer
          OIDC_AUDIENCE                  = aws_cognito_user_pool_client.public.id
          OIDC_AUDIENCE_CLAIM            = "client_id"
          OIDC_JWKS_URL                  = local.cognito_jwks_url
          OIDC_ALLOWED_ALGORITHMS        = "RS256"
          AWS_REGION                     = var.aws_region
        }
      }
    }
  }

  instance_configuration {
    cpu               = var.service_cpu
    memory            = var.service_memory
    instance_role_arn = aws_iam_role.apprunner_instance.arn
  }

  health_check_configuration {
    protocol            = "HTTP"
    path                = "/healthz"
    interval            = 10
    timeout             = 5
    healthy_threshold   = 1
    unhealthy_threshold = 5
  }

  auto_scaling_configuration_arn = aws_apprunner_auto_scaling_configuration_version.this.arn

  lifecycle {
    precondition {
      condition     = var.public_base_url != ""
      error_message = "public_base_url must be set when container_image_identifier creates the App Runner service."
    }
  }

  depends_on = [
    aws_iam_role_policy.apprunner_data,
    aws_iam_role_policy_attachment.apprunner_ecr,
    aws_s3_bucket_policy.account_snapshots,
  ]
}
