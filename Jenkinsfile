pipeline {
  agent any
  stages {
    stage('snyk') {
      steps {
        snykSecurity(monitorProjectOnBuild: true, projectName: 'goof')
      }
    }
  }
}