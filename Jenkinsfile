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
                    // Start WITHOUT port mapping (only on Docker network)
                    sh """
                        docker run -d \
                            --name ${NEW_CONTAINER} \
                            --network ${DOCKER_NETWORK} \
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
        
        stage('Switch Traffic - Zero Downtime') {
            steps {
                script {
                    echo 'Switching traffic to new container...'
                    
                    // Step 1: Stop and remove OLD container (frees port 3000)
                    sh """
                        echo "Stopping old container..."
                        docker stop ${OLD_CONTAINER} 2>/dev/null || true
                        docker rm ${OLD_CONTAINER} 2>/dev/null || true
                    """
                    
                    // Small delay to ensure port is released
                    sleep 2
                    
                    // Step 2: Remove the new container (we'll recreate it)
                    sh """
                        echo "Removing new container..."
                        docker stop ${NEW_CONTAINER}
                        docker rm ${NEW_CONTAINER}
                    """
                    
                    // Step 3: Create container with correct name and port
                    sh """
                        echo "Starting container with production configuration..."
                        docker run -d \
                            --name ${OLD_CONTAINER} \
                            --network ${DOCKER_NETWORK} \
                            -p ${CONTAINER_PORT}:3000 \
                            ${DOCKER_IMAGE}:${BUILD_NUMBER}
                    """
                    
                    sleep 5
                    
                    // Verify deployment
                    sh """
                        echo "Verifying deployment..."
                        docker ps | grep ${OLD_CONTAINER}
                        echo "Container status:"
                        docker inspect ${OLD_CONTAINER} --format='Container: {{.Name}} | Status: {{.State.Status}} | Port: {{(index (index .NetworkSettings.Ports "3000/tcp") 0).HostPort}}'
                    """
                    
                    echo 'Traffic switched successfully!'
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
            echo """
            Deployment Successful!
            Build: ${BUILD_NUMBER}
            Container: ${OLD_CONTAINER}
            Access: http://<your-host-ip>:${CONTAINER_PORT}
            """
        }
    }
}