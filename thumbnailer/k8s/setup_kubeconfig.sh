#!/bin/zsh
# Helper script that lets you get your environment setup as a stolen pod

decode_base64_url() {
  local len=$((${#1} % 4))
  local result="$1"
  if [ $len -eq 2 ]; then result="$1"'=='
  elif [ $len -eq 3 ]; then result="$1"'='
  fi
  echo "$result" | tr '_-' '/+' | base64 -d
}

echo "Enter token: "
read TOKEN
echo "Enter kubernetes API host:"
read K8S

echo "Creating configuration for https://$K8S"

DECODE=$(decode_base64_url $(echo -n $TOKEN | cut -d "." -f 2) | jq .)

echo "With token:"
echo $DECODE

echo "Press any key to continue..."
read continue

if [ -f demokubeconfig ]
then
	rm ./demokubeconfig
fi
touch ./demokubeconfig
export KUBECONFIG=./demokubeconfig
export HISTFILE=./.zsh_history
kubectl config set-credentials snyk --token="$TOKEN" 
kubectl config set-cluster exploited --insecure-skip-tls-verify=true --server=https://$K8S
kubectl config set-context exploited --cluster=exploited --user=snyk
kubectl config use-context exploited
