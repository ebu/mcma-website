# MCMA Project
An MCMA project is a grouping of several discrete logical parts known as "services." The diagram below provides an overview of how these services interact within an MCMA project:

<img class="environment-arch" src="/images/diagrams/project-arch.png"/>

At minimum, an MCMA project should have two services: a Service Registry and a Job Processor.

### Service Registry 
The service registry is used for service discovery. This is used internally by the job processor to find services capable of processing jobs, and can also be used by external clients to find other services that handle other types of resources as well. While the service registry currently only exposes capabilities as mappings of endpoints to resource types, it may be extended to support exposing additional capabilities in the future.
### Job Processor
The job processor is the brain of the MCMA environment. It should be the entry point for all requested processing, as it handles the routing of these requests, known as jobs, to the services that can process them. The job processor is also responsible for monitoring jobs, both to check if they have exceeded specified limits on processing time and to clean up old job data when it's no longer needed.
### Other Services
Beyond the Service Registry and the Job Processor, an MCMA environment should have services that actually perform business-related tasks. These services may be implemented to perform relatively simple tasks, e.g. transcoding or automated metadata extraction, or they may have more complex implementations that involve the orchestration of many jobs into a single workflow.