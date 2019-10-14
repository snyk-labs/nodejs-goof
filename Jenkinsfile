pipeline {
  agent any
  
  tools {nodejs "node"}

  }
  stages {
    stage('build') {
      steps {
        sh 'npm install'
      }
    }
    stage('snyk') {
      steps {
        snykSecurity(monitorProjectOnBuild: true, projectName: 'goof', severity: 'low')
      }
    }
  }
}
