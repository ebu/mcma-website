# The Worker Function
We'll write our worker function first, as this is where we will focus on what we actually want the service to do - transcoding.

### Create a new Node.js project
Let's start by creating a new folder for our function:
``` shell
mkdir worker
cd worker
npm init ffmpeg-service-worker
```

### Install MCMA for a worker function on AWS
Then we'll install the base and AWS packages using npm:
``` shell
npm i @mcma/aws-client @mcma/aws-dynamodb @mcma/aws-logger @mcma/aws-s3 @mcma/client @mcma/core @mcma/data @mcma/worker
```
> [!NOTE]
> MCMA packages reference one another as [peer dependencies](https://nodejs.org/en/blog/npm/peer-dependencies/) so each package must be installed independently. 

### Write the worker function

#### Import AWS types
We'll start by importing the types we need from AWS:
``` typescript
import * as AWS from "aws-sdk";
import { Context } from "aws-lambda";
```

#### Import MCMA core types
We also need to import some core MCMA types. These classes are part of the base set of libraries upon which all of the provider-specific libraries are built.
``` typescript
import { TransformJob } from "@mcma/core";
import { AuthProvider, ResourceManagerProvider } from "@mcma/client";
```

#### Import MCMA worker types
The base libraries provide some types for implementing a worker function that we'll want to use.
``` typescript
import {
    ProcessJobAssignmentOperation,
    ProviderCollection,
    Worker,
    WorkerRequest,
    WorkerRequestProperties
} from "@mcma/worker";
```
##### [ProviderCollection](~/api/nodejs/worker.ProviderCollection.yml)
"Providers" are classes that create objects with platform-specific implementations for the worker. The function's startup code in the will add platform-specific providers to this collection and then pass it to the worker.
##### [Worker](~/api/nodejs/worker.Worker.yml)
This class handles routing worker requests to their registered handlers. When building a worker function, an implementer should register named handlers with the worker in order to have it route requests to their code.
##### [WorkerRequestProperties](~/api/nodejs/worker.WorkerRequestProperties.yml)
A request to the worker to do some work, specifying the name of the operation and any inputs that it may need.
##### [WorkerRequest](~/api/nodejs/worker.WorkerRequest.yml)
This is a concrete implementation of the WorkerRequestProperties interface that validates that the operationName property is set.
##### [ProcessJobAssignmentOperation](~/api/nodejs/worker.ProcessJobAssignmentOperation.yml)
An operation that we'll register with the worker to handle the processing of [TransformJobs](~/api/nodejs/core.TransformJob.yml). This class exposes an interface for registering handlers for [JobProfiles](~/api/nodejs/core.JobProfile.yml).

#### Import MCMA AWS types
Let's also import types from the MCMA libraries so that we can interact with AWS services through MCMA interfaces.
``` typescript
import { DynamoDbTableProvider } from "@mcma/aws-dynamodb";
import { AwsCloudWatchLoggerProvider } from "@mcma/aws-logger";
import { awsV4Auth } from "@mcma/aws-client";
```

#### Configure our providers

``` typescript
const authProvider = new AuthProvider().add(awsV4Auth(AWS));
const dbTableProvider = new DynamoDbTableProvider();
const loggerProvider = new AwsCloudWatchLoggerProvider("ffmpeg-service-worker", process.env.LogGroupName);
const resourceManagerProvider = new ResourceManagerProvider(authProvider);

const providerCollection = new ProviderCollection({
    authProvider,
    dbTableProvider,
    loggerProvider,
    resourceManagerProvider
});
```
Here we are registering AWS-specific providers with the ProviderCollection. This hooks up our worker with DynamoDB for data storage and CloudWatch for logging, as well as configuring AWS4 authentication for any calls it might make to other services (through the [ResourceManager](~/api/nodejs/client.ResourceManager.yml)).

#### Register job processing and profiles
``` typescript
const processJobAssignmentOperation =
    new ProcessJobAssignmentOperation(TransformJob)
        .addProfile("ExtractThumbnail", extractThumbnail);

const worker =
    new Worker(providerCollection)
        .addOperation(processJobAssignmentOperation);
```
We add the ProcessJobAssignmentOperation to the worker in order to give us job processing capabilites, and then add a handler for the "ExtractThumbnail" TransformJob profile.

#### Add a Lambda handler function
This is the function that we will configure Lambda to invoke. It is simply a lightweight wrapper around our worker that adds some logging and error handling.
``` typescript
export async function handler(event: WorkerRequestProperties, context: Context) {
    const logger = loggerProvider.get(context.awsRequestId, event.tracker);

    try {
        logger.functionStart(context.awsRequestId);
        logger.debug(event);
        logger.debug(context);

        await worker.doWork(new WorkerRequest(event, logger));
    } catch (error) {
        logger.error("Error occurred when handling operation '" + event.operationName + "'");
        logger.error(error.toString());
    } finally {
        logger.functionEnd(context.awsRequestId);
        await loggerProvider.flush();
    }
}
```

<div class="article-footer-nav">
    <a class="prev" href="intro.md"><i class="glyphicon glyphicon-chevron-left"></i> Introduction</a>
    <a class="next" href="api-handler.md">Writing an API Handler <i class="glyphicon glyphicon-chevron-right"></i></a>
</div>