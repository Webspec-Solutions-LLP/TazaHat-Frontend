pipeline {
    agent any

    // One pipeline, one job per tenant (brand): the TENANT parameter picks deploy/tenants/<tenant>.env (container, port, website addresses,
    // API container). The first choice is the default, so a push build deploys TazaHat as before.
    parameters {
        choice(name: 'TENANT', choices: ['tazahat', 'machranga'], description: 'Which brand to deploy')
    }

    environment {
        IMAGE_TAG = "latest"
        // Server-wide proxy network (managed by the MONGO-DB infra repo).
        NETWORK_NAME = "proxy-net"
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

        stage('Tenant') {
            steps {
                script {
                    // every KEY=value line of deploy/tenants/<tenant>.env becomes an environment variable of the steps below
                    def file = "deploy/tenants/${params.TENANT ?: 'tazahat'}.env"
                    for (String line : readFile(file).split('\n')) {
                        def t = line.trim()
                        int at = t.indexOf('=')
                        if (t.startsWith('#') || at < 1) { continue }
                        env[t.substring(0, at).trim()] = t.substring(at + 1).trim()
                    }
                    // File with the Google Maps key (created by the backend repository's deploy/server-setup.sh, inside Jenkins' home volume). It is
                    // used in the browser (map, build time) and on the server (address lookup, run time).
                    env.GOOGLE_MAPS_KEY_FILE = "${env.ENV_DIR}/google-maps-key"
                    currentBuild.displayName = "#${env.BUILD_NUMBER} ${env.TENANT}"
                    echo "Deploying ${env.BRAND_NAME}: ${env.VIRTUAL_HOSTS}"
                }
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
                      GOOGLE_MAPS_KEY="$(cat "$GOOGLE_MAPS_KEY_FILE")"
                      docker build --pull \
                        --build-arg API_BASE_URL="$API_BASE_URL" \
                        --build-arg BRAND="$TENANT" \
                        --build-arg NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="$GOOGLE_MAPS_KEY" \
                        -t "${IMAGE_NAME}:${IMAGE_TAG}" .
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
                  GOOGLE_MAPS_KEY="$(cat "$GOOGLE_MAPS_KEY_FILE")"
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
                    -e API_BASE_URL="$API_BASE_URL" \
                    -e GOOGLE_MAPS_API_KEY="$GOOGLE_MAPS_KEY" \
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
            echo "Deployment successful (${env.TENANT}): ${env.VIRTUAL_HOSTS}"
        }
        failure {
            sh 'docker logs --tail 100 "$CONTAINER_NAME" || true'
        }
    }
}
