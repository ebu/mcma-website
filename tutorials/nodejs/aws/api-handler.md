# The API Handler
Every MCMA service should expose an API with at least one resource endpoint that's registered with the Service Registry. In this case, our service handles `JobAssignment` resources, which is really just another way of saying that our service processes jobs.
## Create a new Node.js project
We'll need another folder for our API function, following the same pattern 
``` shell
mkdir api-handler
cd api-handler
npm init ffmpeg-service-api-handler
mkdir src
```
We can use the same `tsconfig.json` we used for our worker function. Our folder structure should now look like this:
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
└── worker
    ├── package.json
    ├── package-lock.json
    ├── src
    │   └── index.ts
    └── tsconfig.json
```
## Install MCMA packages for an API handler function on AWS
Once again, let's start by installing the base and AWS packages via NPM:
``` shell
npm i @mcma/core @mcma/client @mcma/data @mcma/api @mcma/worker-invoker @mcma/aws-api-gateway @mcma/aws-client @mcma/aws-dynamodb @mcma/aws-lambda-worker-invoker @mcma/aws-logger
```
This time we installed some API-specific packages (`@mcma/api` and `@mcma/aws-api-gateway`) and for invoking the worker (`@mcma/worker-invoker` and `@mcma/aws-lambda-worker-invoker`), rather than the worker-related packages we installed for our worker function. 
## Write the code
### Import AWS types
The `aws-lambda` module provides us with types that define what the input to our function from an API Gateway integration will look like.
``` typescript
import { APIGatewayProxyEvent, Context } from "aws-lambda";
```
### Import MCMA types
To simplify the implementation, we're going to import `DefaultJobRouteCollection` in order to build our API. We'll also pull in AWS-specific implementations for integrating an HTTP API (API Gateway), logging (CloudWatch), data access (DynamoDB), and invoking an MCMA worker (using [Lambda event invocation](https://docs.aws.amazon.com/lambda/latest/dg/API_Invoke.html)).
``` typescript
import { DefaultJobRouteCollection } from "@mcma/api";
import { DynamoDbTableProvider } from "@mcma/aws-dynamodb";
import { invokeLambdaWorker } from "@mcma/aws-lambda-worker-invoker";
import { AwsCloudWatchLoggerProvider } from "@mcma/aws-logger";
import { ApiGatewayApiController } from "@mcma/aws-api-gateway";
```
### Create the API controller
To handle integration with API Gateway, we'll create an `ApiGatewayApiController` that wraps an `McmaApiController`. This wrapper translates the API Gateway-specific request and response objects into generic objects that the MCMA framework understands.
``` typescript
const loggerProvider = new AwsCloudWatchLoggerProvider("ffmpeg-service-api-handler", process.env.LogGroupName);
const dbTableProvider = new DynamoDbTableProvider();
const defaultJobRouteCollection = new DefaultJobRouteCollection(dbTableProvider, invokeLambdaWorker);

const restController = new ApiGatewayApiController(defaultJobRouteCollection, loggerProvider);
```
The `DefaultJobRouteCollection` gives us basic CRUD operations for the `JobAssignment` resource type. By creating our controller with these routes, the API will now support the following requests:
```
GET     /job-assignments
POST    /job-assignments
GET     /job-assignments/{jobAssignmentId}
PUT     /job-assignments/{jobAssignmentId}
DELETE  /job-assignments/{jobAssignmentId}
```
Doing a `POST` to the `job-assignments` endpoint will ultimately invoke the worker for processing. However, this call requires that a job already have been created, so typically it will not be invoked directly. Instead, a caller will create the job by calling the Job Processor, and the Job Processor will find the appropriate service to process the job and make the `POST` request to its `job-assignments` endpoint.
> [!NOTE]
> The `DefaultJobRouteCollection` class can be used to easily build simple APIs for processing jobs in MCMA. While changing and/or extending its behavior is possible, it may not be suitable for more advanced use cases. In these cases, it is advisable that the implementer write and register their own custom routes and handlers.
### Create the handler function
Much like with the worker, this is the function that we will configure Lambda to invoke, wrapping the call to the MCMA code with logging and error handling.
``` typescript
export async function handler(event: APIGatewayProxyEvent, context: Context) {
    const logger = loggerProvider.get(context.awsRequestId);
    try {
        logger.functionStart(context.awsRequestId);
        logger.debug(event);
        logger.debug(context);

        return await restController.handleRequest(event, context);
    } finally {
        logger.functionEnd(context.awsRequestId);
        await loggerProvider.flush(Date.now() + context.getRemainingTimeInMillis() - 5000);
    }
}
```
At this point we've written all the code we need to run our MCMA service. Next, we'll take a look at how to use Terraform to deploy and configure our service on AWS.

<div class="article-footer-nav">
    <a class="prev" href="worker.md"><i class="glyphicon glyphicon-chevron-left"></i> Writing a Worker Function</a>
    <a class="next" href="terraform.md">Deploying with Terraform <i class="glyphicon glyphicon-chevron-right"></i></a>
</div>