pipeline {
    agent any
    tools {nodejs "node:20.5.1-pnpm"}
    parameters {
        string(name: 'ENV_PROD', defaultValue: '', description: 'production or staging')
        string(name: "AWS_ECR_URL", defaultValue: "", description: "AWS ECR URL")
    }
    stages {
        stage('set .env') {
            steps {
                script {
                    echo "${params.ENV_PROD}"
                    sh "echo '${params.ENV_PROD}' > .env"
                    sh "cat .env"
                }
            }
        }

        stage('Test docker image build') {
            steps {
                sh "pnpm docker:build:test"
            }
        }
        stage('Test') {
            steps {
                sh "pnpm docker:test"
            }
        }
        stage('Test e2e') {
            steps {
                sh "pnpm docker:test:e2e"
            }
        }
        stage('Build Production docker image') {
            steps {
                sh 'pnpm docker:build'
            }
        }
        stage('Deploy - Production docker image ') {
            steps {
                echo 'docker tag hoit/api-server:latest ${params.AWS_ECR_URL}:latest'
                echo 'docker push ${params.AWS_ECR_URL}:latest'

            }
        }
    }
}
