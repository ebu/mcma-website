# Wrapping FFmpeg
In order to use FFmpeg from our Node.js function, we'll need to wrap it in an interface we can use in our code.
## Create an FFmpeg Lambda Layer
AWS Lambda offers a feature called "Layers" that is a perfect fit for packaging external binaries like FFmpeg, so we're going to create an FFmpeg layer to add the binary to our worker function. You can read more about Layers [here](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html).
### Download static FFmpeg build
First we need to pull down a static build of FFmpeg that will run on the Amazon Linux OS that Lambda runs on. John Van Sickle has kindly provided a build we can use [here](https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz). If you plan to use this build beyond the purposes of the this demo, please consider [supporting John](https://johnvansickle.com/ffmpeg/) to show your appreciation.
### Package the FFmpeg binary
Extract the `ffmpeg` binary file from the root of the downloaded archive and put it into a folder called `bin`, then add the `bin` folder to a new zip archive called `ffmpeg.zip`.
> [!NOTE]
> If you're using Windows, [WinRAR](https://www.win-rar.com) is a good option for extracting from `.tar.xz` files and can also be used to create `.zip` files.
### Copy the package
Copy the package to a subfolder in our service's directory:
```
.
├── ffmpeg
│   └── ffmpeg.zip
└── worker
    ├── package.json
    ├── package-lock.json
    ├── src
    │   └── index.ts
    └── tsconfig.json
```
We'll look at how this gets deployed with our worker function later.
## Create the `ffmpeg` function
We'll create the wrapper function in a TypeScript module in the worker's root directory:
```
.
├── ffmpeg
    └── ffmpeg.zip
└── worker
    ├── package.json
    ├── package-lock.json
    ├── src
    │   ├── ffmpeg.ts
    │   └── index.ts
    └── tsconfig.json
```
### Invoking as a child process
The easiest way for us to gain access to all that FFmpeg has to offer is to simply invoke it as we would from the command line, but from within our Node.js function. The `child_process` module that comes with the Node framework allows us to do just that.
``` typescript
import * as util from "util";
import * as childProcess from "child_process";

const execFile = util.promisify(childProcess.execFile);

export async function ffmpeg(params) {
    const { stdout, stderr } = await execFile("/opt/bin/ffmpeg", params);

    return {
        stdout: stdout,
        stderr: stderr
    };
}
```
This function does little more than take in a set of arguments and run the `ffmpeg` command with them, returning the `stdout` and `stderr` from the process. The path we're looking for `ffmpeg` in is the location in which our Lambda Layer will put it, and we'll take a deeper look at that when actually do the deployment of the function.
> [!NOTE]
> The `util` module is often used to promisify async calls, such as the `execFile` function of the `child_process` module, as MCMA typically uses the `async`/`await` model.

### Calling the function
Now we can invoke FFmpeg from our code much the way we would from the command line, with something as simple as:
``` typescript
import { ffmpeg } from "./ffmpeg";

const { stdout, stderr } = await ffmpeg([/* command-line args here */]);
```
We'll see this in action in the next article, where we'll call it from an MCMA job profile handler.

<div class="article-footer-nav">
    <a class="prev" href="worker.md"><i class="glyphicon glyphicon-chevron-left"></i> Scaffolding a Worker Function</a>
    <a class="next" href="profile.md">Adding a Job Profile <i class="glyphicon glyphicon-chevron-right"></i></a>
</div>