#!/bin/bash
MYDIR=$(dirname $0)
export KIND_SUBNET=$(docker network inspect kind -f '{{(index .IPAM.Config 0).Subnet}}' | cut -f 1,2 -d '.')
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/master/manifests/namespace.yaml
kubectl create secret generic -n metallb-system memberlist --from-literal=secretkey="$(openssl rand -base64 128)"
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/master/manifests/metallb.yaml
kubectl wait --namespace=metallb-system \
             --for=condition=ready pod \
             --selector=app=metallb \
             --timeout=90s
cat $MYDIR/metallb-config.yaml | envsubst | kubectl apply -f -


