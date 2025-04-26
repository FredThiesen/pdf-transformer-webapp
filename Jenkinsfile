pipeline {
    agent any

    tools {nodejs "nodejs"}

    stages {
        stage('Check Git Repository') {
            steps {
                sh '''
                echo "Current directory: $(pwd)"
                git status || echo "Git repository not found"
                '''
            }
        }

        stage("Clean") {
            steps {
                sh "rm -rf node_modules"
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build Project') {
            steps {
                sh 'npm run build'
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}