pipeline {
    agent any
        tools
            {
            nodejs 'NodeJS 11.0.0'
            }

            environment {
                    SNYK_TOKEN = 'da12766a-46b6-4186-8ba1-83eb1aae653c'
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


        stage('Snyk Monitor') {
          steps {
            sh 'echo "***RUNNING SNYK TEST***"'
            sh 'snyk monitor --org=fdf3b63a-9a4e-43d8-bae3-85212f002bea --project-name=JenkinsGoof'
                }
            }


      stage('Snyk Test') {
              steps {
                sh 'echo "***RUNNING SNYK TEST***"'
                sh 'snyk test || true'
                sh 'snyk code test'
                    }
                }
     }
    }
