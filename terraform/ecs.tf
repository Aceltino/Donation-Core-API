# ECR Repositories
# Procure por este bloco no arquivo ecs.tf
resource "aws_ecr_repository" "repos" {
  for_each = toset(["api-gateway", "donation-core", "worker-hub"])
  name     = each.key

  # ESTA LINHA É A CHAVE: Deve estar DENTRO das chaves do recurso
  force_delete = true 

  image_scanning_configuration {
    scan_on_push = true
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "transparencia-agil-cluster"

  tags = {
    Name = "transparencia-agil-cluster"
  }
}

# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "transparencia-agil-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# =====================================================================
# NOVA CONFIGURAÇÃO: ECS Task Role (Permissões para o código do Node.js)
# =====================================================================

resource "aws_iam_role" "ecs_task_role" {
  name = "transparencia-agil-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# Cria a política permitindo invocar a Lambda
resource "aws_iam_policy" "worker_lambda_invoke" {
  name        = "transparencia-agil-worker-lambda-invoke-policy"
  description = "Permite que as tasks do ECS invoquem a Lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        # Puxa o ARN da Lambda que você já tem definida no seu TF
        Resource = aws_lambda_function.example.arn 
      }
    ]
  })
}

# Anexa a política à Task Role
resource "aws_iam_role_policy_attachment" "ecs_task_role_lambda_policy" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.worker_lambda_invoke.arn
}