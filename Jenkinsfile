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
    }
    
    // post {
    //     success {
    //         echo 'Pipeline completed successfully'
    //         slackSend message: "Build ${BUILD_NUMBER} - SUCCESS"
    //     }
        
    //     failure {
    //         echo 'Pipeline failed'
    //         slackSend message: "Build ${BUILD_NUMBER} - FAILURE"
    //     }
        
    //     always {
    //         echo 'Cleaning up workspace...'
    //         cleanWs()
    //     }
    // }
}