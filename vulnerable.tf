# Vulnerable Terraform configuration
# WARNING: This contains security misconfigurations for demonstration purposes only

provider "aws" {
  region = "us-west-2"
}

# Security group that allows SSH from anywhere (0.0.0.0/0)
# This is a security risk as it exposes SSH to the entire internet
resource "aws_security_group" "allow_ssh" {
  name        = "allow_ssh"
  description = "Allow SSH from anywhere"
  
  # Ingress rule allowing SSH from any IP
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # This is the security vulnerability
  }

  # Egress rule allowing all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Example EC2 instance using the vulnerable security group
resource "aws_instance" "example" {
  ami           = "ami-0c55b159cbfafe1f0"  # Amazon Linux 2 AMI (us-west-2)
  instance_type = "t2.micro"
  
  vpc_security_group_ids = [aws_security_group.allow_ssh.id]
  
  # Intentionally not encrypting the root volume
  root_block_device {
    volume_size = 8
    volume_type = "gp2"
    # encrypted = true  # This is intentionally commented out to create a vulnerability
  }
  
  tags = {
    Name = "Vulnerable-Instance"
  }
}

# Output the public IP of the instance (which would be publicly accessible via SSH)
output "instance_public_ip" {
  value       = aws_instance.example.public_ip
  description = "The public IP of the instance (exposed to the internet)"
}
