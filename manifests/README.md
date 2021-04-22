## Kubernetes deployment manifests for Snyk Goof application

### Step 1 - Build goof container image
Build the goof application container image using the Dockerfile in the repo top level directory.  Substitute whatever image tag you want.

```bash
docker build -t goof:v1 .
```

Push your image to your registry.  For example, if on DockerHub with username "johndoe":
```bash
docker tag goof:v1 johndoe/goof:v1  ## Skip this if you built with this tag above
docker push johndoe/goof:v1
```

### Step 2 - Set correct image tag
Edit the `goof-deployment.yaml` file to use the image tag you build and/or pushed above
```yaml
...
spec:
  replicas: 1
  selector:
    matchLabels:
      app: goof
      tier: frontend
  template:
    metadata:
      labels:
        app: goof
        tier: frontend
    spec:
      containers:
        - name: goof
          image: johndoe/goof:v1
          resources:
            requests:
              cpu: 100m
              memory: 100Mi
...
```

### Step 3 - Deploy the application
Assuming you are cd'ed to the top level directory of this repo:
```bash
kubectl apply -f manifests/
```

Check that it's running (This is an example from Docker Desktop K8s, other clusters may vary but should largely look similar)
```
kubectl get all

NAME                              READY   STATUS    RESTARTS   AGE
pod/goof-dd88b47bc-99mwf          1/1     Running   0          7s
pod/goof-mongo-66f98d594c-nzthc   1/1     Running   0          7s

NAME                 TYPE           CLUSTER-IP       EXTERNAL-IP   PORT(S)                       AGE
service/goof         LoadBalancer   10.98.35.54      localhost     80:31749/TCP,9229:30502/TCP   7s
service/goof-mongo   ClusterIP      10.108.141.179   <none>        27017/TCP                     7s
service/kubernetes   ClusterIP      10.96.0.1        <none>        443/TCP                       16d

NAME                         READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/goof         1/1     1            1           7s
deployment.apps/goof-mongo   1/1     1            1           7s

NAME                                    DESIRED   CURRENT   READY   AGE
replicaset.apps/goof-dd88b47bc          1         1         1       7s
replicaset.apps/goof-mongo-66f98d594c   1         1         1       7s
```
