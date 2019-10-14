pipeline {
  agent {
    node {
      label 'node agent'
    }

  }
  stages {
    stage('snyk') {
      steps {
        snykSecurity(monitorProjectOnBuild: true, projectName: 'goof', severity: 'low')
      }
    }
  }
}