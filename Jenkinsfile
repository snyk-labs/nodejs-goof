pipeline {
  agent any
  stages {
    stage('build') {
      steps {
        sh 'npm install'
      }
    }
    stage('snyk') {
      steps {
        snykSecurity(monitorProjectOnBuild: true)
      }
    }
  }
}