#!/bin/bash
MYDIR="$(dirname "$(readlink "$0")")"
kind create cluster --config $MYDIR/kind-config.yaml
kubectl apply -f $MYDIR/calico.yaml
$MYDIR/lb.sh
