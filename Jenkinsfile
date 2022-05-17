pipeline {
    agent any
        tools
            {
            nodejs 'NodeJS 18.1.0'
            }

            environment {
                    SNYK_TOKEN = 'da12766a-46b6-4186-8ba1-83eb1aae653c'
                }

    stages {
        stage('Install Snyk and Snyk Filter') {
              steps {
                sh 'node -v'
                sh 'npm prune'
                sh 'npm install -g snyk'
                sh 'npm install -g snyk-filter'
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
                sh 'snyk test --json-file-output=vuln.json || true'
                sh 'snyk-filter -i vuln.json -f example-licenses-only.yml'
                sh 'snyk code test'
                    }
                }
     }
    }
