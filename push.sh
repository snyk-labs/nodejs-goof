#!/bin/bash

# Stage all modified files
git add .

# Commit with a prompt for your message
git commit -m "Dylan Fixing Issues"

# Push your changes to the remote branch
git push origin $(git branch --show-current)
