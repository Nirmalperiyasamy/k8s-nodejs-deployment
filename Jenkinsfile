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
        
        stage('Verify Container') {
            steps {
                script {
                    echo 'Verifying container is running...'
                    sh """
                        docker logs ${CONTAINER_NAME}
                        echo ""
                        echo "Container started successfully"
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
                slackSend (
                    color: '#00FF00',
                    message: """
*BUILD SUCCESS* :white_check_mark:

*Project:* ${JOB_NAME}
*Build:* #${BUILD_NUMBER}
*Duration:* ${buildDuration}
*Docker Image:* ${DOCKER_IMAGE}:jenkins-${BUILD_NUMBER}
*Container:* ${CONTAINER_NAME} on port ${CONTAINER_PORT}

*Test Application:* http://localhost:${CONTAINER_PORT}

<${BUILD_URL}|View Build Details> | <${BUILD_URL}console|Console Output>
                    """.stripIndent(),
                    channel: '#jenkins'
                )
            }
        }
        
        failure {
            echo 'Pipeline failed'
            script {
                def buildDuration = currentBuild.durationString.replace(' and counting', '')
                slackSend (
                    color: '#FF0000',
                    message: """
*BUILD FAILED* :x:

*Project:* ${JOB_NAME}
*Build:* #${BUILD_NUMBER}
*Duration:* ${buildDuration}

*Action Required:* Check console output for details

<${BUILD_URL}console|View Console Output> | <${BUILD_URL}|Build Details>
                    """.stripIndent(),
                    channel: '#jenkins'
                )
            }
        }
        
        always {
            echo 'Cleaning up workspace...'
            cleanWs()
        }
    }
}