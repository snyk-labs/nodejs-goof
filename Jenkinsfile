pipeline {
  agent any
  stages {
    stage('') {
      steps {
        snykSecurity(monitorProjectOnBuild: true, organisation: 'goof', projectName: 'goof')
      }
    }
  }
}