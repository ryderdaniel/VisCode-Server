FROM node:16

WORKDIR /app

COPY --chown=root . /app

RUN npm install
EXPOSE 6386

ENTRYPOINT ["node"]
CMD ["main.js"]
