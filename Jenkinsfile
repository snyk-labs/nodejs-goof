pipeline {
    agent
    { node { label 'master' } }
    stages {
        stage('Snyk Test') {
            steps {
                sh 'ls -la'
                snykSecurity additionalArguments: '--project-name=goof-jenkins-pipeline --remote-repo-url=goof-jenkins-pipeline --remote-repo-url=goof-jenkins-cli --project-environment=frontend --project-lifecycle=production --project-business-criticality=high --project-tags=CI=Jenkins,PCI=yes', failOnIssues: false, snykInstallation: 'SnykPlugin', snykTokenId: 'SnykAPI'
            }
        }
    }
}
