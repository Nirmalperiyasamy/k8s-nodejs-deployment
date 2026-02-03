pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE = 'nirmal1611/nodejs-k8s-demo'
        CONTAINER_NAME = 'nodejs-app-jenkins'
        CONTAINER_PORT = '3000'
    }
    
    stages {
        stage('Cleanup Old Resources') {
            steps {
                script {
                    echo 'Cleaning up old containers and images...'
                    sh '''
                        docker rm -f ${CONTAINER_NAME} || true
                        docker rmi ${DOCKER_IMAGE}:jenkins-${BUILD_NUMBER} || true
                    '''
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
                            docker build -t ${DOCKER_IMAGE}:jenkins-${BUILD_NUMBER} .
                            docker tag ${DOCKER_IMAGE}:jenkins-${BUILD_NUMBER} ${DOCKER_IMAGE}:jenkins-latest
                        """
                    }
                    echo "Built image: ${DOCKER_IMAGE}:jenkins-${BUILD_NUMBER}"
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
                            docker push ${DOCKER_IMAGE}:jenkins-${BUILD_NUMBER}
                            docker push ${DOCKER_IMAGE}:jenkins-latest
                            docker logout
                        """
                    }
                    echo "Successfully pushed to Docker Hub"
                }
            }
        }
        
        stage('Run Container') {
            steps {
                script {
                    echo 'Running Docker container...'
                    sh """
                        docker run -d \
                            --name ${CONTAINER_NAME} \
                            -p ${CONTAINER_PORT}:3000 \
                            ${DOCKER_IMAGE}:jenkins-${BUILD_NUMBER}
                    """
                    
                    echo 'Waiting for container to start...'
                    sleep 10
                    
                    sh 'docker ps | grep ${CONTAINER_NAME}'
                    echo 'Container is running successfully'
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    echo 'Performing health check...'
                    sh """
                        curl -f http://localhost:${CONTAINER_PORT}/health
                        echo ""
                        echo "Health check passed"
                    """
                }
            }
        }
        
        stage('Test Endpoints') {
            steps {
                script {
                    echo 'Testing application endpoints...'
                    sh """
                        echo "Testing main endpoint..."
                        curl -s http://localhost:${CONTAINER_PORT}/ | head -5
                        echo ""
                        echo "Testing API info endpoint..."
                        curl -s http://localhost:${CONTAINER_PORT}/api/info | head -5
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo 'Pipeline completed successfully'
            script {
                def buildDuration = currentBuild.durationString.replace(' and counting', '')
                emailext (
                    subject: "SUCCESS: Jenkins Build #${BUILD_NUMBER}",
                    body: """
                        <html>
                        <body>
                            <h2 style="color: green;">Build Successful</h2>
                            <table border="1" cellpadding="5">
                                <tr><td><strong>Project</strong></td><td>${JOB_NAME}</td></tr>
                                <tr><td><strong>Build Number</strong></td><td>${BUILD_NUMBER}</td></tr>
                                <tr><td><strong>Status</strong></td><td style="color: green;">SUCCESS</td></tr>
                                <tr><td><strong>Duration</strong></td><td>${buildDuration}</td></tr>
                                <tr><td><strong>Docker Image</strong></td><td>${DOCKER_IMAGE}:jenkins-${BUILD_NUMBER}</td></tr>
                                <tr><td><strong>Container</strong></td><td>${CONTAINER_NAME}</td></tr>
                                <tr><td><strong>Port</strong></td><td>${CONTAINER_PORT}</td></tr>
                            </table>
                            <br>
                            <h3>Test Application:</h3>
                            <ul>
                                <li><a href="http://localhost:${CONTAINER_PORT}">Main Endpoint</a></li>
                                <li><a href="http://localhost:${CONTAINER_PORT}/health">Health Check</a></li>
                                <li><a href="http://localhost:${CONTAINER_PORT}/api/info">API Info</a></li>
                            </ul>
                            <br>
                            <p><a href="${BUILD_URL}">View Build Details</a></p>
                            <p><a href="${BUILD_URL}console">View Console Output</a></p>
                        </body>
                        </html>
                    """,
                    to: 'your_email@gmail.com',
                    mimeType: 'text/html'
                )
            }
        }
        
        failure {
            echo 'Pipeline failed'
            script {
                def buildDuration = currentBuild.durationString.replace(' and counting', '')
                emailext (
                    subject: "FAILED: Jenkins Build #${BUILD_NUMBER}",
                    body: """
                        <html>
                        <body>
                            <h2 style="color: red;">Build Failed</h2>
                            <table border="1" cellpadding="5">
                                <tr><td><strong>Project</strong></td><td>${JOB_NAME}</td></tr>
                                <tr><td><strong>Build Number</strong></td><td>${BUILD_NUMBER}</td></tr>
                                <tr><td><strong>Status</strong></td><td style="color: red;">FAILURE</td></tr>
                                <tr><td><strong>Duration</strong></td><td>${buildDuration}</td></tr>
                            </table>
                            <br>
                            <h3>Action Required:</h3>
                            <p>Please check the console output for error details.</p>
                            <br>
                            <p><a href="${BUILD_URL}console">View Console Output</a></p>
                            <p><a href="${BUILD_URL}">View Build Details</a></p>
                        </body>
                        </html>
                    """,
                    to: 'nirmalperiasamy1611@gmail.com',
                    mimeType: 'text/html'
                )
            }
        }
        
        always {
            echo 'Cleaning up workspace...'
            cleanWs()
        }
    }
}