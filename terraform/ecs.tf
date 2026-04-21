# ECR Repositories
resource "aws_ecr_repository" "repos" {
  for_each = toset(var.ecr_repositories)
  name     = each.value

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "transparencia-agil-${each.value}"
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