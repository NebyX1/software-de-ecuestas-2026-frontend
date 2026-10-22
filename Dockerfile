FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build && node scripts/prepare-nginx.mjs

FROM nginxinc/nginx-unprivileged:stable-alpine
USER root
RUN rm /etc/nginx/conf.d/default.conf
COPY --from=build /app/nginx.generated.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1
