FROM nginx:latest

COPY --chown=root ./nginx.conf /etc/nginx/nginx.conf
COPY --chown=root ./server.crt /etc/ssl/server.crt
COPY --chown=root ./server.key /etc/ssl/server.key

RUN chown nginx:nginx /var/cache/nginx

EXPOSE 443
