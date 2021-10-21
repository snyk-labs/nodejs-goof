resource "aws_kms_key" "a" {
  description             = "key 1"
  deletion_window_in_days = 10
}