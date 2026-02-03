pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE = 'nirmal1611/nodejs-k8s-demo'
        NEW_CONTAINER = "nodejs-app-new"
        OLD_CONTAINER = "nodejs-app-current"
        CONTAINER_PORT = '3000'
        DOCKER_NETWORK = 'app-network'
    }
    
    stages {
        stage('Setup Network') {
            steps {
                script {
                    echo 'Creating Docker network if not exists...'
                    sh """
                        docker network create ${DOCKER_NETWORK} || true
                    """
                }
            }
        }
        
        stage('Checkout Code') {
            steps {
                echo 'Checking out code from GitHub...'
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                script {
                    echo 'Installing Node.js dependencies...'
                    dir('app') {
                        sh 'npm ci'
                    }
                }
            }
        }
        
        stage('Run Tests') {
            steps {
                script {
                    echo 'Running tests...'
                    dir('app') {
                        sh 'npm test'
                    }
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    echo 'Building Docker image...'
                    dir('app') {
                        sh """
                            docker build -t ${DOCKER_IMAGE}:${BUILD_NUMBER} .
                            docker tag ${DOCKER_IMAGE}:${BUILD_NUMBER} ${DOCKER_IMAGE}:latest
                        """
                    }
                }
            }
        }
        
        stage('Push to Docker Hub') {
            steps {
                script {
                    echo 'Pushing image to Docker Hub...'
                    withCredentials([usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        sh """
                            echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin
                            docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}
                            docker push ${DOCKER_IMAGE}:latest
                            docker logout
                        """
                    }
                }
            }
        }
        
        stage('Deploy New Container') {
            steps {
                script {
                    echo 'Starting new container...'
                    sh """
                        docker run -d \
                            --name ${NEW_CONTAINER} \
                            --network ${DOCKER_NETWORK} \
                            -p 3001:3000 \
                            ${DOCKER_IMAGE}:${BUILD_NUMBER}
                    """
                    
                    echo 'Waiting for new container to start...'
                    sleep 10
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    echo 'Running health check on new container...'
                    // Use container name instead of localhost
                    def healthCheck = sh(
                        script: """
                            docker run --rm --network ${DOCKER_NETWORK} \
                                curlimages/curl:latest \
                                curl -f http://${NEW_CONTAINER}:3000/health || \
                            docker run --rm --network ${DOCKER_NETWORK} \
                                curlimages/curl:latest \
                                curl -f http://${NEW_CONTAINER}:3000/
                        """,
                        returnStatus: true
                    )
                    
                    if (healthCheck != 0) {
                        error("Health check failed for new container")
                    }
                    
                    echo 'Health check passed!'
                }
            }
        }
        
        stage('Switch Traffic') {
            steps {
                script {
                    echo 'Switching traffic to new container...'
                    
                    // Stop old container
                    sh """
                        docker stop ${OLD_CONTAINER} || true
                        docker rm ${OLD_CONTAINER} || true
                    """
                    
                    // Stop new container
                    sh "docker stop ${NEW_CONTAINER}"
                    sh "docker rm ${NEW_CONTAINER}"
                    
                    // Start container with production name and port
                    sh """
                        docker run -d \
                            --name ${OLD_CONTAINER} \
                            --network ${DOCKER_NETWORK} \
                            -p ${CONTAINER_PORT}:3000 \
                            ${DOCKER_IMAGE}:${BUILD_NUMBER}
                    """
                    
                    sleep 5
                    
                    echo 'Deployment completed successfully!'
                }
            }
        }
        
        stage('Cleanup') {
            steps {
                script {
                    echo 'Cleaning up old images...'
                    sh """
                        docker image prune -f --filter "until=24h" || true
                    """
                }
            }
        }
    }
    
    post {
        failure {
            script {
                echo 'Deployment failed, cleaning up...'
                sh """
                    docker rm -f ${NEW_CONTAINER} || true
                """
            }
        }
        
        success {
            echo "Deployment successful! App running at http://<your-host-ip>:${CONTAINER_PORT}"
        }
    }
}