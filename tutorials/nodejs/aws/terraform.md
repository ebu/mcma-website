# Deploying with Terraform
If you are not familiar with Terraform, it's advised that you read more about it [here](https://www.terraform.io/intro/index.html). MCMA relies heavily on Terraform for managing and deploying cloud infrastructure, so understanding what it is and how it works can be incredibly helpful when working with MCMA.
## Create a Terraform folder
Terraform has the notion of modules, which we'll use to create a deploment script for our service that can be pulled into a master script for an MCMA project later on. We'll start by creating a `module` folder, where we will put all the subsequent files we create in this step:
```
.
├── api-handler
│   ├── package.json
│   ├── package-lock.json
│   ├── src
│   │   └── index.ts
│   └── tsconfig.json
├── ffmpeg
│   └── ffmpeg.zip
├── module
└── worker
    ├── package.json
    ├── package-lock.json
    ├── src
    │   └── index.ts
    └── tsconfig.json
```
## Create a variables file
Terraform uses a convention of storing input variables into a separate file named `variables.tf`. Let's create thate file and put the input following values that we'll need to deploy all of the resources for our service:
``` terraform
variable environment_type {}
variable global_prefix {}
variable aws_account_id {}
variable aws_region {}
```
> [!NOTE]
>  The `global_prefix` variable is used as a way of scoping our resources. This ensures that our resource names are unique and allows for multiple MCMA projects to deployed in the same AWS account and region.

## Create the DynamoDB table
Our service data will be stored in a DynamoDB table, so we'll create and configure that now.
``` terraform
resource "aws_dynamodb_table" "ffmpeg_service_table" {
  name         = "${var.global_prefix}-ffmpeg-service"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "resource_type"
  range_key    = "resource_id"

  attribute {
    name = "resource_type"
    type = "S"
  }

  attribute {
    name = "resource_id"
    type = "S"
  }

  stream_enabled   = true
  stream_view_type = "NEW_IMAGE"
}
```
> [!NOTE]
> By default, MCMA uses the `resource_type` and `resource_id` as hash key and range keys, respectively. When necessary, this can be customized, which requires both changes to the deployment scripts and the code.
## Create the Worker
Now we'll add resources for our worker lambda.
### Add the FFmpeg Layer
We'll need to create the FFmpeg Lambda Layer we packaged previously, then reference it from our worker Lambda function.
``` terraform
resource "aws_lambda_layer_version" "ffmpeg" {
  filename         = "../ffmpeg/ffmpeg.zip"
  layer_name       = "${var.global_prefix}-ffmpeg-service-ffmpeg"
  source_code_hash = filebase64sha256("../ffmpeg/ffmpeg.zip")
}
```
### Create the Worker Function
``` terraform
resource "aws_lambda_function" "ffmpeg_service_worker" {
  filename         = "../worker/build/dist/lambda.zip"
  function_name    = format("%.64s", "${var.global_prefix}-ffmpeg-service-worker")
  role             = aws_iam_role.iam_for_exec_lambda.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("../worker/build/dist/lambda.zip")
  runtime          = "nodejs10.x"
  timeout          = "900"
  memory_size      = "3008"

  layers = [aws_lambda_layer_version.ffmpeg.arn]

  environment {
    variables = {
      LogGroupName     = var.global_prefix
      TableName        = aws_dynamodb_table.ffmpeg_service_table.name
      PublicUrl        = local.ffmpeg_service_url
      ServicesUrl      = local.services_url
      ServicesAuthType = local.service_registry_auth_type
    }
  }
}
```
## Create the API Handler
The API handler consists of two parts: an API Gateway REST API with a wildcard route, integrated with our API Handler Lambda function.
### Create the API Handler Function
The API handler function is created much the same way the worker function is, with some minor changes. The API handler does not need the FFmpeg layer, as it will not be invoking FFmpeg directly, and it's configured with an environment variable `WorkerFunctionId` which holds the name of the worker Lambda function. This is used by the `LambdaWorkerInvoker` to invoke our worker function via the AWS Lambda SDK.
``` terraform
resource "aws_lambda_function" "ffmpeg_service_api_handler" {
  filename         = "../api-handler/build/dist/lambda.zip"
  function_name    = format("%.64s", "${var.global_prefix}-ffmpeg-service-api-handler")
  role             = aws_iam_role.iam_for_exec_lambda.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("../api-handler/build/dist/lambda.zip")
  runtime          = "nodejs10.x"
  timeout          = "30"
  memory_size      = "3008"

  environment {
    variables = {
      LogGroupName     = var.global_prefix
      TableName        = aws_dynamodb_table.ffmpeg_service_table.name
      PublicUrl        = local.ffmpeg_service_url
      ServicesUrl      = local.services_url
      ServicesAuthType = local.service_registry_auth_type
      WorkerFunctionId = aws_lambda_function.ffmpeg_service_worker.function_name
    }
  }
}
```

### Create the API Gateway REST API
The API Gateway integration is composed of a number of resources.
#### The REST API
This gives us an empty REST API without any routes:
``` terraform
resource "aws_api_gateway_rest_api" "ffmpeg_service_api" {
  name        = "${var.global_prefix}-ffmpeg-service"
  description = "FFmpeg Service REST API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}
```
#### The REST API Resource
This adds a route to the REST API:
``` terraform
resource "aws_api_gateway_resource" "ffmpeg_service_api_resource" {
  rest_api_id = aws_api_gateway_rest_api.ffmpeg_service_api.id
  parent_id   = aws_api_gateway_rest_api.ffmpeg_service_api.root_resource_id
  path_part   = "{proxy+}"
}
```
We are using `{proxy+}` to pass along the entire route from the request to our Lambda handler. We're not going to use API Gateway to define our routes because MCMA uses its own routing logic internally.
#### The REST API Method
This adds a method to the REST API:
``` terraform
resource "aws_api_gateway_method" "ffmpeg_service_api_method" {
  rest_api_id   = aws_api_gateway_rest_api.ffmpeg_service_api.id
  resource_id   = aws_api_gateway_resource.ffmpeg_service_api_resource.id
  http_method   = "ANY"
  authorization = "AWS_IAM"
}
```
We are using `ANY` much the same way we are using `{proxy+}` in the route. The internal MCMA routing logic will check which methods are allowed for which routes.
#### Lambda Integration
We'll then hook up our API route to our Lambda handler:
``` terraform
resource "aws_api_gateway_integration" "ffmpeg_service_api_method_integration" {
  rest_api_id             = aws_api_gateway_rest_api.ffmpeg_service_api.id
  resource_id             = aws_api_gateway_resource.ffmpeg_service_api_resource.id
  http_method             = aws_api_gateway_method.ffmpeg_service_api_method.http_method
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${var.aws_region}:${var.aws_account_id}:function:${aws_lambda_function.ffmpeg_service_api_handler.function_name}/invocations"
  integration_http_method = "POST"
}
```
#### Lambda Permission
In order to allow API Gateway to invoke our Lambda handler, we have to grant it permissions:
``` terraform
resource "aws_lambda_permission" "apigw_ffmpeg_service_api_handler" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ffmpeg_service_api_handler.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:${var.aws_region}:${var.aws_account_id}:${aws_api_gateway_rest_api.ffmpeg_service_api.id}/*/${aws_api_gateway_method.ffmpeg_service_api_method.http_method}/*"
}
```
#### API Gateway Deployment
Finally, we need to create a deployment and a starge for our API Gateway in order to actually make it publicly available:
``` terraform
resource "aws_api_gateway_deployment" "ffmpeg_service_deployment" {
  depends_on = [
    aws_api_gateway_integration.ffmpeg_service_api_method_integration
  ]

  rest_api_id = aws_api_gateway_rest_api.ffmpeg_service_api.id
}

resource "aws_api_gateway_stage" "ffmpeg_service_gateway_stage" {
  depends_on = [
    aws_api_gateway_integration.ffmpeg_service_api_method_integration
  ]

  stage_name    = var.environment_type
  deployment_id = aws_api_gateway_deployment.ffmpeg_service_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.ffmpeg_service_api.id

  variables = {
    DeploymentHash   = filesha256("./services/ffmpeg-service.tf")
  }
}
```


<div class="article-footer-nav">
    <a class="prev" href="api-handler.md"><i class="glyphicon glyphicon-chevron-left"></i> Writing an API Handler</a>
    <div class="spacer">
</div>