# S3 Bucket for Lambda
resource "aws_s3_bucket" "lambda" {
  bucket = var.lambda_bucket_name

  tags = {
    Name = "transparencia-agil-lambda-bucket"
  }
}

# 1. Cria um arquivo zip "falso" localmente só para passar pela validação
data "archive_file" "dummy_lambda" {
  type        = "zip"
  output_path = "${path.module}/dummy_lambda.zip"
  source {
    content  = "exports.handler = async (event) => { return 'OK'; };"
    filename = "index.js"
  }
}

# 2. Faz o upload desse zip falso para o S3
resource "aws_s3_object" "lambda_zip" {
  bucket = aws_s3_bucket.lambda.id
  key    = "lambda.zip"
  source = data.archive_file.dummy_lambda.output_path
}

# Lambda Function
resource "aws_lambda_function" "example" {
  function_name = "transparencia-agil-lambda"
  runtime       = "nodejs18.x"
  handler       = "index.handler"
  
  # 3. Aponta para o arquivo que acabou de ser feito o upload
  s3_bucket     = aws_s3_bucket.lambda.bucket
  s3_key        = aws_s3_object.lambda_zip.key 

  role = aws_iam_role.lambda_exec.arn

  # Garante que o Lambda só tente ser criado DEPOIS que o zip estiver no S3
  depends_on = [aws_s3_object.lambda_zip] 

  tags = {
    Name = "transparencia-agil-lambda"
  }
}

# IAM Role for Lambda (mantém exatamente igual)
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