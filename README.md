# Goof - Snyk's vulnerable demo app
[![Known Vulnerabilities](https://snyk.io/test/github/snyk/goof/badge.svg?style=flat-square)](https://snyk.io/test/github/snyk/goof)

A vulnerable Node.js demo application, based on the [Dreamers Lab tutorial](http://dreamerslab.com/blog/en/write-a-todo-list-with-express-and-mongodb/).

## Features

This vulnerable app includes the following capabilities to experiment with:
* [Exploitable packages](#exploiting-the-vulnerabilities) with known vulnerabilities
* [Docker Image Scanning](#docker-image-scanning) for base images with known vulnerabilities in system libraries
* [Runtime alerts](#runtime-alerts) for detecting an invocation of vulnerable functions in open source dependencies

## Running
```bash
mongod &

git clone https://github.com/Snyk/snyk-demo-todo
npm install
npm start
```
This will run Goof locally, using a local mongo on the default port and listening on port 3001 (http://localhost:3001)

## Running with docker-compose
```bash
docker-compose up --build
docker-compose down
```

### Heroku usage
Goof requires attaching a MongoLab service to be deployed as a Heroku app. 
That sets up the MONGOLAB_URI env var so everything after should just work. 

### CloudFoundry usage
Goof requires attaching a MongoLab service and naming it "goof-mongo" to be deployed on CloudFoundry. 
The code explicitly looks for credentials to that service. 

### Cleanup
To bulk delete the current list of TODO items from the DB run:
```bash
npm run cleanup
```

## Exploiting the vulnerabilities

This app uses npm dependencies holding known vulnerabilities.

Here are the exploitable vulnerable packages:
- [Mongoose - Buffer Memory Exposure](https://snyk.io/vuln/npm:mongoose:20160116)
- [st - Directory Traversal](https://snyk.io/vuln/npm:st:20140206)
- [ms - ReDoS](https://snyk.io/vuln/npm:ms:20151024)
- [marked - XSS](https://snyk.io/vuln/npm:marked:20150520)

The `exploits/` directory includes a series of steps to demonstrate each one.

## Docker Image Scanning

The `Dockerfile` makes use of a base image (`node:6-stretch`) that is known to have system libraries with vulnerabilities.

To scan the image for vulnerabilities, run:
```bash
snyk test --docker node:6-stretch --file=Dockerfile
```

To monitor this image and receive alerts with Snyk:
```bash
snyk monitor --docker node:6-stretch
```

## Runtime Alerts

Snyk provides the ability to monitor application runtime behavior and detect an invocation of a function is known to be vulnerable and used within open source dependencies that the application makes use of.

The agent is installed and initialized in [app.js](./app.js#L5).

For the agent to report back to your snyk account on the vulnerabilities it detected it needs to know which project on Snyk to associate with the monitoring. Due to that, we need to provide it with the project id through an environment variable `SNYK_PROJECT_ID`

To run the Node.js app with runtime monitoring:
```bash
SNYK_PROJECT_ID=<PROJECT_ID> npm start
```

** The app will continue to work normally even if not provided a project id

## Fixing the issues
To find these flaws in this application (and in your own apps), run:
```
npm install -g snyk
snyk wizard
```

In this application, the default `snyk wizard` answers will fix all the issues.
When the wizard is done, restart the application and run the exploits again to confirm they are fixed.
