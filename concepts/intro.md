# What is MCMA?
The acronym MCMA stands for "Media Cloud Microservice Architecture." It is a set of patterns and practices used to govern the implementation of micro-service architectures in cross-cloud and/or hybrid environments, with a particular focus on the needs of media workflows.
<br/>
<br/>

## What MCMA Provides
In addition to providing guidance and best practices, the MCMA group has authored a number of packages, across various platforms and languages, to facilitate the development of services that follow these patterns.
<br/><br/>
The current set of available libraries supports development on the following platforms:
<br/>
<br/>
<table >
    <thead>
        <tr>
            <th></th>
            <th><div class="framework"><img src="../images/frameworks/nodejs.svg" width="50"></div></th>
            <th><div class="framework"><img src="../images/frameworks/dotnet.jpg" width="40"></div></th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><div class="cloud-provider"><img src="../images/cloud-providers/aws.png" width="50"></div></td>
            <td><div class="version-number">1.0</div></td>
            <td><div class="version-number">1.0</div></td>
        </tr>
        <tr>
            <td><div class="cloud-provider"><img src="../images/cloud-providers/azure.png" width="50"></div></td>
            <td><div class="version-number">1.0</div></td>
            <td><div class="version-number">1.0</div></td>
        </tr>
        <tr>
            <td><div class="cloud-provider"><img src="../images/cloud-providers/google-cloud.png" width="35"></div></td>
            <td><div class="version-number">1.0</div></td>
            <td><div class="version-number">beta</div></td>
        </tr>
    </tbody>
</table>
<br/>

## How MCMA Focuses On Media
While much of what MCMA provides is not necessarily media-centric, MCMA strives to meet the needs of media technology in particular. A focus on media means that  long-running transactions, asynchronous processing, and workflow orchestration are all considered as first-class citizens. The MCMA group is comprised entirely of members working in media technology who understand the unique challenges that media can present, and the patterns defined by MCMA reflect this understanding.
<br/>
<br/>

## What MCMA Is Not
MCMA is not an all-encompassing standardization of media services or their metadata models. The data model is concerned primarily with defining the most basic definitions required for services to discover and communicate with one another. MCMA allows you to bring your own metadata and to write your own services that understand that metadata. It is a foundation upon which to build rather than a standard to which to conform.