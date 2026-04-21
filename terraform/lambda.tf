# S3 Bucket for Lambda
resource "aws_s3_bucket" "lambda" {
  bucket = var.lambda_bucket_name

  tags = {
    Name = "transparencia-agil-lambda-bucket"
  }
}

# Lambda Function
resource "aws_lambda_function" "example" {
  function_name = "transparencia-agil-lambda"
  runtime       = "nodejs18.x"
  handler       = "index.handler"
  s3_bucket     = aws_s3_bucket.lambda.bucket
  s3_key        = "lambda.zip"  # Assume a zip file is uploaded

  role = aws_iam_role.lambda_exec.arn

  tags = {
    Name = "transparencia-agil-lambda"
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_exec" {
  name = "transparencia-agil-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}