# Grupos de Logs (CloudWatch)
resource "aws_cloudwatch_log_group" "api_gateway_logs" { name = "/ecs/api-gateway" }
resource "aws_cloudwatch_log_group" "donation_core_logs" { name = "/ecs/donation-core" }
resource "aws_cloudwatch_log_group" "worker_hub_logs" { name = "/ecs/worker-hub" }

# --- API GATEWAY ---
resource "aws_ecs_task_definition" "api_gateway" {
  family                   = "api-gateway-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "api-gateway-service"
      image     = "${aws_ecr_repository.repos["api-gateway"].repository_url}:latest"
      essential = true
      environment = [
        { name = "PORT", value = "3000" },
        { name = "DATABASE_URL", value = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.endpoint}/${aws_db_instance.postgres.db_name}?schema=public" },
        { name = "REDIS_URL", value = "redis://${aws_elasticache_cluster.redis.cache_nodes[0].address}:6379" },
        { name = "STRIPE_SECRET_KEY", value = var.stripe_secret_key },
        { name = "DONATION_CORE_URL", value = "http://${aws_lb.main.dns_name}" },
        { name = "DONATION_SUCCESS_URL", value = "http://${aws_lb.main.dns_name}/success" },
        { name = "DONATION_CANCEL_URL", value = "http://${aws_lb.main.dns_name}/cancel" },
        { name = "NEW_RELIC_LICENSE_KEY", value = var.new_relic_license_key },
        { name = "NEW_RELIC_APP_NAME", value = "api-gateway" }
      ]
      portMappings = [{ containerPort = 3000, hostPort = 3000 }]
      logConfiguration = {
        logDriver = "awslogs"
        options = { "awslogs-group" = aws_cloudwatch_log_group.api_gateway_logs.name, "awslogs-region" = var.region, "awslogs-stream-prefix" = "ecs" }
      }
    }
  ])
}

# --- DONATION CORE ---
resource "aws_ecs_task_definition" "donation_core" {
  family                   = "donation-core-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "donation-core-service"
      image     = "${aws_ecr_repository.repos["donation-core"].repository_url}:latest"
      essential = true
      environment = [
        { name = "PORT", value = "3000" },
        { name = "DATABASE_URL", value = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.endpoint}/${aws_db_instance.postgres.db_name}?schema=public" },
        { name = "STRIPE_SECRET_KEY", value = var.stripe_secret_key },
        { name = "STRIPE_WEBHOOK_SECRET", value = var.stripe_webhook_secret },
        { name = "NEW_RELIC_LICENSE_KEY", value = var.new_relic_license_key },
        { name = "NEW_RELIC_APP_NAME", value = "donation-core" }
      ]
      portMappings = [{ containerPort = 3000, hostPort = 3000 }]
      logConfiguration = {
        logDriver = "awslogs"
        options = { "awslogs-group" = aws_cloudwatch_log_group.donation_core_logs.name, "awslogs-region" = var.region, "awslogs-stream-prefix" = "ecs" }
      }
    }
  ])
}

# --- WORKER HUB ---
resource "aws_ecs_task_definition" "worker_hub" {
  family                   = "worker-hub-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "worker-hub-service"
      image     = "${aws_ecr_repository.repos["worker-hub"].repository_url}:latest"
      essential = true
      environment = [
        { name = "AWS_REGION", value = var.region },
        { name = "LAMBDA_FUNCTION_NAME", value = aws_lambda_function.example.function_name },
        { name = "REDIS_URL", value = "redis://${aws_elasticache_cluster.redis.cache_nodes[0].address}:6379" },
        { name = "NEW_RELIC_LICENSE_KEY", value = var.new_relic_license_key },
        { name = "NEW_RELIC_APP_NAME", value = "worker-hub" }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = { "awslogs-group" = aws_cloudwatch_log_group.worker_hub_logs.name, "awslogs-region" = var.region, "awslogs-stream-prefix" = "ecs" }
      }
    }
  ])
}

# SERVIÇOS DO ECS 

resource "aws_ecs_service" "api_gateway_svc" {
  name            = "api-gateway-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api_gateway.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    assign_public_ip = true
  }
}

resource "aws_ecs_service" "donation_core_svc" {
  name            = "donation-core-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.donation_core.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    assign_public_ip = true
  }
}

resource "aws_ecs_service" "worker_hub_svc" {
  name            = "worker-hub-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.worker_hub.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    assign_public_ip = true
  }
}