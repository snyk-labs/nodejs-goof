resource "aws_s3_bucket" "insecure-bucket" {
  bucket = "insecure-bucket"
}

resource "aws_ebs_volume" "example" {
  availability_zone = "us-east-1a"
  size              = 20
  encrypted         = false
  tags = {
    Name = "insecure"
  }
}
