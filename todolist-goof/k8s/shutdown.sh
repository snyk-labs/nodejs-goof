#!/usr/bin/env bash
MYDIR=$(dirname $0)
echo "Removing app from kubernetes..."
kubectl delete -f $MYDIR/java-goof.yaml
