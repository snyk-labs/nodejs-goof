#!/bin/bash

# if kubectl is not installed, install it
if ! [ -x "$(command -v kubectl)" ]; then
    echo "kubectl not found, installing..."
    curl -LO https://storage.googleapis.com/kubernetes-release/release/`curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt`/bin/linux/amd64/kubectl
    chmod +x ./kubectl
    sudo mv ./kubectl /usr/local/bin/kubectl
fi

echo "Inatlling/Upgrading awscli..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

echo "Installing jq, gettext, bash-completion, moreutils, pngcrush..."

#if ubuntu use apt-get else use yum (amazon linux)
if [ -x "$(command -v apt-get)" ]; then
    sudo apt-get update && sudo apt-get install -y jq gettext bash-completion moreutils pngcrush
else
    sudo yum install -y jq gettext bash-completion moreutils pngcrush ImageMagick
fi

echo "Installing yq for yaml processing..."
echo 'yq() {
  docker run --rm -i -v "${PWD}":/workdir mikefarah/yq "$@"
}' | tee -a ~/.bashrc && source ~/.bashrc

echo "Enabling kubectl bash_completion..."
kubectl completion bash >>  ~/.bash_completion
echo "source <(kubectl completion bash)" >> ~/.bashrc

echo "Aliasing 'k' to 'kubectl'..."
echo "alias k=kubectl" >> ~/.bashrc
echo "complete -F __start_kubectl k" >> ~/.bashrc

export DOCKER_BUILDKIT=1
echo "export DOCKER_BUILDKIT=1" >> ~/.bashrc

echo "Done. Please source ~/.bashrc to complete the installation."