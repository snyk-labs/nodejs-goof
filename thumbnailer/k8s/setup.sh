#!/usr/bin/env bash
kind create cluster --config kind.yaml
kubectl wait --for=condition=Ready nodes\
       --all \
       --timeout=90s

kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
kubectl wait --namespace ingress-nginx \
             --for=condition=ready pod \
             --selector=app.kubernetes.io/component=controller \
             --timeout=90s

