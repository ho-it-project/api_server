pipeline {
    agent any

    stages {
        stage('Get Environment Variables TEST') {
            steps {
                script {
                    echo "${params.ENV_PROD}"
                    sh "echo '${params.ENV_PROD}' > .env"
                    sh "cat .env"
                }
            }
        }
        stage('ls') {
            steps {
                sh "ls"
            }
        }
        stage('Test') {
            steps {
                echo 'Testing...'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying...'
            }
        }
        stage('webhook test') {
            steps {
                echo 'webhook ...23'
            }
        }
    }
}
