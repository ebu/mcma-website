# The API Handler

### Install MCMA packages for an API handler function on AWS
Once again, let's start by installing the base and AWS packages via NPM:
``` shell
npm i @mcma/core @mcma/client @mcma/data @mcma/worker-invoker @mcma/aws-api-gateway @mcma/aws-client @mcma/aws-dynamodb @mcma/aws-lambda-worker-invoker @mcma/aws-logger
```

### Write the code
``` typescript
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { DefaultJobRouteCollection } from "@mcma/api";
import { DynamoDbTableProvider } from "@mcma/aws-dynamodb";
import { invokeLambdaWorker } from "@mcma/aws-lambda-worker-invoker";
import { AwsCloudWatchLoggerProvider } from "@mcma/aws-logger";
import { ApiGatewayApiController } from "@mcma/aws-api-gateway";

const loggerProvider = new AwsCloudWatchLoggerProvider("transform-service-api-handler", process.env.LogGroupName);
const dbTableProvider = new DynamoDbTableProvider();

const restController = new ApiGatewayApiController(new DefaultJobRouteCollection(dbTableProvider, invokeLambdaWorker), loggerProvider);

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

<div class="article-footer-nav">
    <a class="prev" href="worker.md"><i class="glyphicon glyphicon-chevron-left"></i> Writing a Worker Function</a>
    <a class="next" href="terraform.md">Deploying with Terraform <i class="glyphicon glyphicon-chevron-right"></i></a>
</div>