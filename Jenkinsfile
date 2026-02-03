pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE = 'nirmal1611/nodejs-k8s-demo'
        CONTAINER_NAME = 'nodejs-app'
        CONTAINER_PORT = '3000'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build & Test') {
            steps {
                dir('app') {
                    sh 'npm ci'
                    sh 'npm test'
                }
            }
        }
        
        stage('Build Image') {
            steps {
                dir('app') {
                    sh "docker build -t ${DOCKER_IMAGE}:${BUILD_NUMBER} ."
                }
            }
        }
        
        stage('Push Image') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh """
                        echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin
                        docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}
                        docker logout
                    """
                }
            }
        }
        
        stage('Deploy') {
            steps {
                sh """
                    # Stop old container
                    docker stop ${CONTAINER_NAME} || true
                    docker rm ${CONTAINER_NAME} || true
                    
                    # Start new container immediately
                    docker run -d \
                        --name ${CONTAINER_NAME} \
                        -p ${CONTAINER_PORT}:3000 \
                        --restart unless-stopped \
                        ${DOCKER_IMAGE}:${BUILD_NUMBER}
                    
                    # Wait and verify
                    sleep 5
                    docker ps | grep ${CONTAINER_NAME}
                """
            }
        }
        
        stage('Cleanup') {
            steps {
                sh "docker image prune -f || true"
            }
        }
    }
    
    post {
        success {
            echo "Deployed: ${DOCKER_IMAGE}:${BUILD_NUMBER}"
        }
        failure {
            echo "Deployment failed"
        }
    }
}