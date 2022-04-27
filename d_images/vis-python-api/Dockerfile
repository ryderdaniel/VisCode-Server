FROM node:16

WORKDIR /app

COPY --chown=root . /app
RUN touch /app/python_trace/compile_exception.log
RUN chmod +x /app/python_trace/*
RUN chmod 666 /app/python_trace/compile_exception.log

RUN npm install
EXPOSE 6386

ENTRYPOINT ["node"]
CMD ["vis-python-api.js"]
