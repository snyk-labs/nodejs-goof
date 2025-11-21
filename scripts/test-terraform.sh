#!/bin/bash
set -e

# Install Terraform if not already installed
if ! command -v terraform &> /dev/null; then
    echo "Terraform not found, installing..."
    wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
    echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
    sudo apt update && sudo apt install -y terraform
fi

# Initialize Terraform
cd "$(dirname "$0")/.."
echo "Initializing Terraform..."
terraform init

# Validate the configuration
echo "Validating Terraform configuration..."
terraform validate

# Create a plan (but don't apply it)
echo "Creating execution plan..."
terraform plan -out=tfplan

echo "Terraform configuration is valid and ready for deployment."
