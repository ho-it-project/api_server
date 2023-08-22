pipeline {
    agent any
    tools {nodejs "node:20.5.1-pnpm"}
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
                sh "docker tag hoit/api-server:latest ${params.AWS_ECR_URL}:latest"
                sh "docker push ${params.AWS_ECR_URL}:latest"
            }
        }
        
        stage('Update ECS Cluster') {
            steps {
                script {
                    def clusterName = 'api-server-cluster' // ECS 클러스터의 이름
                    def serviceName = 'api-server' // 업데이트할 ECS 서비스의 이름

                    // 업데이트를 위해 서비스 업데이트 명령 실행
                    sh "aws ecs update-service --cluster ${clusterName} --service ${serviceName} --force-new-deployment"
                }
            }
        }
    }
}
