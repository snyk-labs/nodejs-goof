pipeline {
    agent
    { node { label 'master' } }
    stages {
        stage('Snyk Test') {
            steps {
                sh 'ls -la'
                snykSecurity additionalArguments: '--project-name=goof-jenkins-pipeline --remote-repo-url=goof-jenkins', failOnIssues: false, snykInstallation: 'SnykPlugin', snykTokenId: 'SnykAPI'
            }
        }
    }
}
