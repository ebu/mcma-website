# MCMA Service
An MCMA service is a logical grouping of one or more micro-services, data stores, queues, or any other components that might be required for the service's intended high-level purpose.

<img class="service-arch" src="/images/diagrams/service-arch.png"/>

At minimum, a service should implement an API handler and register at least one endpoint with the Service Registry for discoverability.

### API Handler Function
The API handler should expose a RESTful API over HTTP, with at least one endpoint that is registered with the Service Registry. All operations performed by the API handler should be short-running and synchronous, following best practices for the HTTP request/response model. Any processing that may take longer than 30 seconds should be moved to a worker (see below). Typically, the API handler is used to read and write to the backing data store and, when applicable, asynchronously invoke worker operations.
### Worker Function
The worker is used to perform any processing that might take longer than 30 seconds and is typically where the business logic for a service resides. Worker operations should be invoked through asynchronous or event-based mechanisms, such as reading from a queue or subscribing to a pub/sub topic. Workers should not expose HTTP endpoints.
### Data Store
In most cases, the API handler and worker functions will require access to a shared data store, such as a table in a document database. Both the API handler and the worker may read and write the same data, so concurrency and consistency issues must be addressed. The MCMA libraries provide some basic solutions for these problems out-of-the-box.
### Other Components
A service may have any number of other components beyond an API handler function and a worker function. The service may also require functions that respond to other triggers for processing work, such as scheduled tasks or storage events. For instance, the standard implementation of the Job Processor service, written by the MCMA team, uses a cron job to schedule regular checking and cleanup of its jobs.
