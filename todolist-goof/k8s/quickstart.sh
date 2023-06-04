#!/usr/bin/env bash
TODO_MYDIR=$(dirname $0)
if [[ "$1" == "" ]]; then
  read -e -i "${DOCKER_ACCOUNT}" -p "Please enter your DockerHub user/account name: " input
  name="${input:-$DOCKER_ACCOUNT}"
else
  DOCKER_ACCOUNT=$1
fi

$TODO_MYDIR/imagebuild.sh $DOCKER_ACCOUNT
$TODO_MYDIR/startup.sh $DOCKER_ACCOUNT


