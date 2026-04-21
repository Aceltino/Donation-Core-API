variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnets" {
  description = "Public subnets CIDRs"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnets" {
  description = "Private subnets CIDRs"
  type        = list(string)
  default     = ["10.0.3.0/24", "10.0.4.0/24"]
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "redis_cluster_id" {
  description = "Redis cluster ID"
  type        = string
  default     = "transparencia-agil-redis"
}

variable "ecr_repositories" {
  description = "ECR repository names"
  type        = list(string)
  default     = ["api-gateway", "donation-core", "worker-hub"]
}

variable "lambda_bucket_name" {
  description = "S3 bucket for Lambda"
  type        = string
  default     = "transparencia-agil-lambda-bucket"
}

variable "stripe_secret_key" {
  description = "Chave secreta da Stripe"
  type        = string
  sensitive   = true
}

variable "stripe_webhook_secret" {
  description = "Chave secreta do Webhook da Stripe"
  type        = string
  sensitive   = true
}

variable "new_relic_license_key" {
  description = "Chave de licença do New Relic"
  type        = string
  sensitive   = true
}

variable "new_relic_app_name" {
  description = "Nome base do app no New Relic"
  type        = string
  default     = "transparencia-agil-prod"
}