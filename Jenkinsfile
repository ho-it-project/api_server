pipeline {
    agent any

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
        stage('webhook test') {
            steps {
                echo 'webhook ...23'
            }
        }
    }
}
