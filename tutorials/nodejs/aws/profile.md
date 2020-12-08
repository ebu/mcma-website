# Adding a JobProfile
We've written our worker function, and we've configured it to handle TransformJobs, but how exactly does it handle these jobs? In our current state, the worker will throw an exception on any request to run a job, indicating that there aren't any handlers registered for the profile.
<br>

For the purpose of this tutorial, we're going to use the fairly simple use case of extracting a thumbnail image from a video file. We'll call this profile 'ExtractThumbnail.'
## Create the `profiles` folder
In our worker function folder, let's create a sub-folder to hold our job profiles:
``` shell
mkdir profiles
```
In our new `profiles` folder, we'll add a new TypeScript file where we'll write the code for our ExtractThumbnail profile. At this point, our service folder structure should look like this:
```
.
└── worker
    ├── package.json
    ├── package-lock.json
    ├── src
    │   ├── ffmpeg.ts
    │   ├── index.ts
    │   └── profiles
    │       └── extract-thumbnail.ts
    └── tsconfig.json
```
## Writing the profile handler
We're now ready to start writing the handler code for the profile.
### Import utilities
Our handler is going to need some basic utilities for file access, promisification, and generating UUIDs, so let's import those:
``` typescript
import * as util from "util";
import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";
```
We're also going to need the AWS SDK to interact with files on S3, from which we'll be downloading the video and to which we'll be uploading our resulting thumbnail:
``` typescript
import * as AWS from "aws-sdk";
```
### Import MCMA types
We also need to import some types from MCMA that help us to interact with the job. From the core libraries, we'll pull in the `McmaException`, which should be used for any error thrown by MCMA code, and the `TransformJob`.The `@mcma/worker` library exports the `ProcessJobAssignmentHelper` type, which provides us with a logger and access to the job's inputs and outputs. We'll also import some `Locator` types from the `@mcma/aws-s3` library that represent locations on S3. These will be our inputs and outputs.
``` typescript
import { McmaException, TransformJob } from "@mcma/core";
```
The `@mcma/worker` library exports the `ProcessJobAssignmentHelper` type, which provides us with a logger and access to the job's inputs and outputs.
``` typescript
import { ProcessJobAssignmentHelper, ProviderCollection } from "@mcma/worker";
```
We'll also import some `Locator` types from the `@mcma/aws-s3` library that represent locations on S3. These will be our inputs and outputs.
``` typescript
import { AwsS3FileLocator, AwsS3FileLocatorProperties, AwsS3FolderLocatorProperties } from "@mcma/aws-s3";
```
### Import our FFmpeg wrapper
We also need the FFmpeg wrapper function we wrote in the previous step:
``` typescript
import { ffmpeg } from "../ffmpeg";
```
### Write the handler function
Our module will export a single function, called `extractThumbnail`.
``` typescript
export async function extractThumbnail(providers: ProviderCollection, jobAssignmentHelper: ProcessJobAssignmentHelper<TransformJob>) {

}
```
Job profile handler functions should always take the same set of arguments, a `ProviderCollection` and a `ProcessJobAssignmentHelper`.
#### Check inputs and outputs
We'll add some code to get our input and output locations and ensure that we've been provided is valid.
``` typescript
    const logger = jobAssignmentHelper.logger;

    const jobInput = jobAssignmentHelper.jobInput;

    const inputFile = jobInput.get<AwsS3FileLocatorProperties>("inputFile");
    const outputLocation = jobInput.get<AwsS3FolderLocatorProperties>("outputLocation");

    if (!inputFile.bucket || !inputFile.key) {
        throw new McmaException("Failed to find bucket and/or key properties on inputFile:\n" + JSON.stringify(inputFile, null, 2));
    }
```
We also need to define where our local files will go, so let's create unique names for our input and output files in the `tmp` folder.
``` typescript
    let tempId = uuidv4();
    let tempVideoFile = "/tmp/video_" + tempId + ".mp4";
    let tempThumbFile = "/tmp/thumb_" + tempId + ".png";
```
> [!NOTE]
> We are accessing the underlying file system for our Lambda function here. There are obviously limitations to this approach, but reading and writing to the `tmp` folder is allowed.
#### Download the video
In order to run FFmpeg, we need to get the source video onto local storage, so we'll use the AWS S3 SDK to download it and write it to our `tmp` location.
``` typescript
    try {
        logger.info("Get video from s3 location: " + inputFile.bucket + " " + inputFile.key);
        const data = await S3.getObject(
            {
                Bucket: inputFile.bucket,
                Key: inputFile.key
            }).promise();

        logger.info("Write video to local storage");
        await fsWriteFile(tempVideoFile, data.Body);
```
#### Run FFmpeg
Now we can invoke our `ffmpeg` function, passing our video file as input (with the `-i` arg), filtering for the video stream (`-vf`), and indicating we want an image (derived from the output file name) with a width of 200 pixels (`scale=200:-1`).
``` typescript
        await ffmpeg(["-i", tempVideoFile, "-vf", "scale=200:-1", tempThumbFile]);
```
#### Upload the thumbnail
Once our FFmpeg command has run, we now have a thumbnail image from our video that we can upload to the specified output location on S3:
``` typescript

        const s3Params = {
            Bucket: outputLocation.bucket,
            Key: (outputLocation.keyPrefix ? outputLocation.keyPrefix : "") + tempId + ".png",
            ContentType: "image/png",
            Body: await fs.createReadStream(tempThumbFile)
        };

        await S3.upload(s3Params).promise();
```
#### Set the output and complete the job
When the upload to S3 is complete, we'll provide the bucket and key of the resulting object into an `AwsS3FileLocator` and set it in the job's output.
``` typescript

        jobAssignmentHelper.jobOutput.set("outputFile", new AwsS3FileLocator({
            bucket: s3Params.Bucket,
            key: s3Params.Key
        }));

        await jobAssignmentHelper.complete();
```
We then indicate that the job has completed successfully by calling `complete()`.
#### Clean up
In the `finally` block, let's clean up the temp files we created.
``` typescript
    } finally {
        try {
            await fsUnlink(tempVideoFile);
        } catch (ignored) {}

        try {
            await fsUnlink(tempThumbFile);
        } catch (ignored) {}
    }
```
Exceptions here will be ignored as this cleanup isn't critical.

## Register the handler with the worker
Now that we have a handler for the 'ExtractThumbnail' profile, we need to register it with the worker. Let's head back to our worker code and modify it to look like the following:
``` typescript
const processJobAssignmentOperation =
    new ProcessJobAssignmentOperation(TransformJob)
        .addProfile("ExtractThumbnail", extractThumbnail); // this registers our profile handler
```
At this point, our worker is ready to process jobs. However, in order to provide a discoverable entry point to which the `Job Processor` can submit jobs, we'll need to expose an API.

<div class="article-footer-nav">
    <a class="prev" href="ffmpeg.md"><i class="glyphicon glyphicon-chevron-left"></i> Wrapping FFmpeg</a>
    <a class="next" href="api-handler.md">Writing the API Handler <i class="glyphicon glyphicon-chevron-right"></i></a>
</div>