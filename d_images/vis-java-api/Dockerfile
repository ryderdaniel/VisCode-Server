FROM node:16
COPY --chown=root ./app /usr/src/vis-java
RUN chmod +x /usr/src/vis-java/javaCompile.sh

RUN apt-get update
RUN apt-get -y install default-jre
RUN apt-get -y install default-jdk

WORKDIR /usr/src/vis-java/jdiDebugTrace
RUN javac -g -cp "org.json.jar" *.java

WORKDIR /usr/src/vis-java
RUN npm install

EXPOSE 6386

ENTRYPOINT ["node"]
CMD ["main.js"]
