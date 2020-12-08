# Writing an MCMA Service with Node.js and Lambda
In this example, we will be implementing a basic transcoding service using [FFmpeg](https://ffmpeg.org/). The code will be written in TypeScript and deployed to AWS.

## What We'll Be Creating
* An MCMA worker function that imports FFmpeg as an AWS Lambda Layer and runs on AWS Lambda
* An MCMA API handler function that runs on AWS Lambda and is invoked through AWS API Gateway.

All of the sample code on the next few pages can be found on GitHub in the [MCMA Node.js AWS sample project](https://github.com/ebu/mcma-projects/tree/master/simple-aws).

## Getting Started
We'll start by creating a directory for the service:
``` shell
mkdir ffmpeg-service
cd ffmpeg-service
```
This gives us a home for all the pieces of our MCMA service. We'll add subdirectories in here for our functions and layers as we go.

<div class="article-footer-nav">
    <div class="spacer"></div>
    <a class="next" href="worker.md">Scaffolding a Worker Function <i class="glyphicon glyphicon-chevron-right"></i></a>
</div>