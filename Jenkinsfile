pipeline {
    agent any
        tools
            {
            nodejs 'NodeJS 8.14.0'
            }

            environment {
                    SNYK_TOKEN = credentials('SNYK_TOKEN')
                }

    stages {
        stage('Install Snyk') {
              steps {
                sh 'node -v'
                sh 'npm prune'
                sh 'npm install -g snyk'
              }
            }

        stage('Build') {
            steps {
            sh 'node -v'
            sh 'npm install'
            }
        }

        stage('Snyk Test') {
          steps {
            sh 'echo "***RUNNING SNYK TEST***"'
            sh 'snyk test --file=pom.xml'
                }
            }

        stage('Snyk Monitor') {
          steps {
            sh 'echo "***RUNNING SNYK TEST***"'
            sh 'snyk monitor --org=0e87a59b-680e-44ad-a33e-9999d62d8469 --severity-threshold=high'
                }
            }
     }
    }
