pipeline {
    agent any

    environment {
        IMAGE_NAME = "tazahat-frontend"
        IMAGE_TAG = "latest"
        CONTAINER_NAME = "tazahat-frontend-service"
        HOST_WEB_PORT = "4006"
        // Server-wide proxy network (managed by the MONGO-DB infra repo).
        NETWORK_NAME = "proxy-net"
        MEMORY_LIMIT = "512m"
        DOMAIN_NAME = "taza.webspec.in"
        VIRTUAL_HOSTS = "taza.webspec.in"
        LETSENCRYPT_HOSTS = "taza.webspec.in"
        LETSENCRYPT_EMAIL = "debnathtapash56@gmail.com"
        NODE_ENV = "production"
    }

    options {
        durabilityHint('MAX_SURVIVABILITY')
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        timestamps()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Image') {
            when {
                anyOf {
                    branch 'master'
                    expression { env.GIT_BRANCH in ['master', 'origin/master'] }
                }
            }
            steps {
                sh '''
                  set -e
                  docker version
                  docker build --pull -t "${IMAGE_NAME}:${IMAGE_TAG}" .
                '''
            }
        }

        stage('Deploy') {
            when {
                anyOf {
                    branch 'master'
                    expression { env.GIT_BRANCH in ['master', 'origin/master'] }
                }
            }
            steps {
                sh '''
                  set -e
                  docker network inspect "$NETWORK_NAME" >/dev/null 2>&1 || docker network create "$NETWORK_NAME"

                  for container_id in $(docker ps -aq --filter "name=${CONTAINER_NAME}"); do
                    docker rm -f "$container_id" >/dev/null 2>&1 || true
                  done

                  docker run -d \
                    --name "$CONTAINER_NAME" \
                    --restart unless-stopped \
                    --network "$NETWORK_NAME" \
                    --memory "$MEMORY_LIMIT" \
                    -p "127.0.0.1:${HOST_WEB_PORT}:3000" \
                    -e PORT=3000 \
                    -e HOSTNAME=0.0.0.0 \
                    -e NODE_ENV="$NODE_ENV" \
                    -e VIRTUAL_HOST="$VIRTUAL_HOSTS" \
                    -e VIRTUAL_PORT=3000 \
                    -e LETSENCRYPT_HOST="$LETSENCRYPT_HOSTS" \
                    -e LETSENCRYPT_EMAIL="$LETSENCRYPT_EMAIL" \
                    --health-cmd="node -e \\"fetch('http://127.0.0.1:3000').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))\\"" \
                    --health-interval=30s \
                    --health-timeout=10s \
                    --health-retries=5 \
                    --health-start-period=30s \
                    "${IMAGE_NAME}:${IMAGE_TAG}"
                '''
            }
        }

        stage('Health Check') {
            when {
                anyOf {
                    branch 'master'
                    expression { env.GIT_BRANCH in ['master', 'origin/master'] }
                }
            }
            steps {
                sh '''
                  set -e
                  READY=0
                  for i in $(seq 1 20); do
                    if docker exec "$CONTAINER_NAME" node -e "fetch('http://127.0.0.1:3000').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))" >/dev/null 2>&1; then
                      READY=1
                      break
                    fi
                    echo "Health check attempt $i failed, retrying..."
                    docker logs --tail 30 "$CONTAINER_NAME" || true
                    sleep 5
                  done

                  [ "$READY" = "1" ] || (echo "Health check failed inside container ${CONTAINER_NAME}" && exit 1)
                '''
            }
        }
    }

    post {
        success {
            echo "Deployment successful: https://${env.DOMAIN_NAME}"
        }
        failure {
            sh 'docker logs --tail 100 "$CONTAINER_NAME" || true'
        }
    }
}
