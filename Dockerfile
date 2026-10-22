FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_TURNSTILE_SITE_KEY
ENV VITE_TURNSTILE_SITE_KEY=${VITE_TURNSTILE_SITE_KEY}
RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine
USER root
RUN rm /etc/nginx/conf.d/default.conf
COPY --chmod=755 docker-entrypoint.d/04-validate-survey-env.sh /docker-entrypoint.d/04-validate-survey-env.sh
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
ENV BACKEND_UPSTREAM=http://backend:5000
ENV TRUSTED_PROXY_CIDR=127.0.0.1/32
ENV NGINX_ENVSUBST_FILTER="^(BACKEND_UPSTREAM|TRUSTED_PROXY_CIDR)$"
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1
