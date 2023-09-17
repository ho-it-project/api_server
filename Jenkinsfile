pipeline {
    agent any
    tools {nodejs "node:20.5.1-pnpm"}
    stages {
        stage('set .env') {
            steps {
                script {
                    echo "${params.AWS_ECR_URL}"
                    echo "${params.ENV_PROD}"
                    sh "echo '${params.ENV_PROD}' > .env"
                    sh "echo '${params.ENV_PROD}' > .env.test"
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
        stage('Deploy - Production docker image') {
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
                    def region = "ap-northeast-2"

                    sh "aws ecs update-service --cluster ${clusterName} --service ${serviceName} --region ${region} --force-new-deployment"
                }
            }
        }
    }
    post {
        always {
            script {
                // 모든 컨테이너 중지 및 삭제
                sh "docker stop \$(docker ps -a -q) || true" // 에러 발생시 스킵
                sh "docker rm \$(docker ps -a -q) -f || true" // 에러 발생시 스킵

                // 모든 네트워크 삭제
                sh "docker network prune -f"

                // 모든 볼륨 삭제
                sh "docker volume prune -f"

                // 모든 이미지 삭제 (이미지를 사용하는 컨테이너를 먼저 중지하고 삭제해야 함)
                def excludeImages = "node:20-alpine" // 제외할 이미지 목록
                def imagesToDelete = sh(returnStdout: true, script: "docker images -q | grep -vE '${excludeImages}'").trim()
                
                if (imagesToDelete) {
                    imagesToDelete.tokenize().each { imageId ->
                        sh "docker rmi -f ${imageId} || true" // 이미지가 없으면 에러 발생시 스킵
                    }
                }
            }
        }
    }
}

