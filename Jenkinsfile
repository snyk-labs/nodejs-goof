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
                sh 'snyk code test || true'
                    }
                }
     }
    }
