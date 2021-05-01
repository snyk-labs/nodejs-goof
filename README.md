# Goof - Snyk's vulnerable demo app
[![Known Vulnerabilities](https://snyk.io/test/github/snyk/goof/badge.svg?style=flat-square)](https://snyk.io/test/github/snyk/goof)

A vulnerable Node.js demo application, based on the [Dreamers Lab tutorial](http://dreamerslab.com/blog/en/write-a-todo-list-with-express-and-mongodb/).

## Features

This vulnerable app includes the following capabilities to experiment with:
* [Exploitable packages](#exploiting-the-vulnerabilities) with known vulnerabilities
* [Container Image Scanning](#container-image-scanning) for base images with known vulnerabilities in system libraries
* [Runtime alerts](#runtime-alerts) for detecting an invocation of vulnerable functions in open source dependencies
* [Kubernetes and Terraform misconfigurations](#iac-misconfigurations) that can open the door to additional threats

---

## Running locally
```bash
mongod &

git clone https://github.com/Snyk/snyk-demo-todo
npm install
npm start
```
This will run Goof locally, using a local mongo on the default port and listening on port 3001 (http://localhost:3001)

### Cleanup
To bulk delete the current list of TODO items from the DB run:
```bash
npm run cleanup
```

## Running with Kubernetes and Kustomize
You can deploy the app as-is to a Kubernetes cluster using kubectl. Make sure you build the goof container first - the deployment will look for `goof:demo` by default.
```bash
docker build -t goof:demo .
kubectl apply -f goof-deployment.yaml 
```

You can also use [Kustomize](https://kustomize.io) to easily inject a Snyk token into the deployment, which will allow the Snyk Container monitor running in your cluster to automatically detect and scan the goof container and send the results back to the Snyk web UI for monitoring. You can directly add your Snyk token to the goof-deployment.yaml, but then you risk having it exposed in your source code repos. The .gitignore file for this project, on the other hand, will ignore the `snyk-token.yaml` file, so this is a better way to handle it.

First, create a `snyk-token.yaml` file with the following. Substitute your Snyk API token where shown.
```
apiVersion: apps/v1
kind: Deployment
metadata:
  annotations:
    orgs.k8s.snyk.io/v1: INSERT-YOUR-SNYK-API-TOKEN-HERE
  name: goof
```

Once you have that file (and Kustomize is installed) you can deploy with:
```bash
kustomize build . | kubectl apply -f -
```

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



---

## Exploiting the vulnerabilities

This app uses npm dependencies holding known vulnerabilities.

Here are the exploitable vulnerable packages:
- [Mongoose - Buffer Memory Exposure](https://snyk.io/vuln/npm:mongoose:20160116) - requires a version <= Node.js 8. For the exploit demo purposes, one can update the Dockerfile `node` base image to use `FROM node:6-stretch`.
- [st - Directory Traversal](https://snyk.io/vuln/npm:st:20140206)
- [ms - ReDoS](https://snyk.io/vuln/npm:ms:20151024)
- [marked - XSS](https://snyk.io/vuln/npm:marked:20150520)

The `exploits/` directory includes a series of steps to demonstrate each one.

---

## Container Image Scanning

The `Dockerfile` makes use of a base image (`node:10-stretch`) that is known to have system libraries with vulnerabilities.

To scan the image for vulnerabilities, build it and then run a Snyk Container test on it:
```bash
docker build -t goof:demo .

snyk container test goof:demo --file=Dockerfile
```

To monitor this image and receive alerts with Snyk:
```bash
snyk container monitor goof:demo
```

---

## Runtime Alerts

Snyk provides the ability to monitor application runtime behavior and detect an invocation of a function is known to be vulnerable and used within open source dependencies that the application makes use of.

The agent is installed and initialized in [app.js](./app.js#L5).

For the agent to report back to your snyk account on the vulnerabilities it detected it needs to know which project on Snyk to associate with the monitoring. Due to that, we need to provide it with the project id through an environment variable `SNYK_PROJECT_ID`

To run the Node.js app with runtime monitoring:
```bash
SNYK_PROJECT_ID=<PROJECT_ID> npm start
```

** The app will continue to work normally even if not provided a project id

---

## IaC Misconfigurations

Snyk can scan your IaC configurations to spot and help fix security misconfigurations for Kubernetes and Terraform. The goof app has both a Kubernetes deployment and a Terraform module. 
> Note: The Terraform sample module included is not required to run the goof app; it's here is purely for demonstration purposes.

The basic form for Snyk Infrastructure as Code (Snyk IaC) tests is `snyk iac test <filespec>`. So to test the Kubernetes deployment:
```bash
snyk iac test goof-deployment.yaml
```

And to test everything in the Terraform directory:
```bash
snyk iac test ./terraform
```

You can also test the Terraform plan output using Snyk. To do that, first make sure you have [Terraform installed](https://learn.hashicorp.com/tutorials/terraform/install-cli) then:
```
cd terraform

# Generate the TF plan output:
terraform init
terraform plan --out=tfplan.out

# Convert the binary plan output to JSON:
terraform show --json tfplan.out > tfplan.json

# Use Snyk to test the plan:
snyk iac test --experimental tfplan.json
```
> Note: the `--experimental` flag is required as of April 30, 2021 in order to test the Terraform plan output as this feature is in beta.

---

## Fixing the issues
### Open source dependency issues
To fix the open source dependency flaws in this application (and in your own apps), run:
```
npm install -g snyk
snyk wizard
```

In this application, the default `snyk wizard` answers will fix all the issues.
When the wizard is done, restart the application and run the exploits again to confirm they are fixed.

### Container issues
Snyk Container will provide base image upgrade advice that will knock out hundreds of vulnerabilities from the original base image. Simply change the `FROM` line in the Dockerfile to match one of the suggestions.

### IaC issues
Snyk IaC will provide recommended fixes as part of the scans. The JSON output of `snyk iac test` provides more details that may be helpful. Try `snyk iac test --json goof-deployment.yaml` to see this output and extra detail.