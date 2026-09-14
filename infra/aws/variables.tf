variable "aws_region" {
  description = "AWS region for the ConvoWeave production stack."
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment label."
  type        = string
  default     = "production"
}

variable "app_name" {
  description = "Lowercase deployment prefix."
  type        = string
  default     = "convoweave"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,30}$", var.app_name))
    error_message = "app_name must be lowercase alphanumeric/hyphen and begin with a letter."
  }
}

variable "cognito_domain_prefix" {
  description = "Globally unique Cognito managed-login domain prefix for the selected region."
  type        = string
}

variable "oauth_callback_urls" {
  description = "OAuth redirect URIs for the mobile app and approved ChatGPT/Claude clients."
  type        = list(string)

  validation {
    condition     = length(var.oauth_callback_urls) > 0
    error_message = "At least one OAuth callback URL is required."
  }
}

variable "oauth_logout_urls" {
  description = "Optional post-logout redirect URIs."
  type        = list(string)
  default     = []
}

variable "public_base_url" {
  description = "Canonical public HTTPS origin for the deployed ConvoWeave MCP service, without a trailing slash. Required when the App Runner service is created."
  type        = string
  default     = ""

  validation {
    condition     = var.public_base_url == "" || can(regex("^https://[^/]+(?:/[^?]*)?$", var.public_base_url))
    error_message = "public_base_url must be empty or an HTTPS URL."
  }
}

variable "container_image_identifier" {
  description = "Full ECR image identifier (repository URL plus tag or digest). Leave empty on the bootstrap apply, then set after pushing the first image."
  type        = string
  default     = ""
}

variable "service_cpu" {
  description = "App Runner service CPU allocation."
  type        = string
  default     = "1 vCPU"
}

variable "service_memory" {
  description = "App Runner service memory allocation."
  type        = string
  default     = "2 GB"
}
