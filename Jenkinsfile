pipeline {
    agent any

    tools { nodejs "nodejs" }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
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

        stage('Deploy') {
            steps {
                sh '''
                    echo "Deploying to transformapdf"
                    rm -rf /home/ubuntu/transformapdf.ricardothiesen.com.br/dist/*
                    cp -r dist/* /home/ubuntu/transformapdf.ricardothiesen.com.br/dist/
                '''
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
