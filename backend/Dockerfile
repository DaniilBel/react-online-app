FROM gradle:jdk17

COPY --chown=gradle:gradle . /app
WORKDIR /app
RUN gradle build

EXPOSE 8080
WORKDIR /app

RUN apt-get update && \
    apt-get install wget postgresql-client --yes && \
    mkdir --parents ~/.postgresql && \
    wget "https://storage.yandexcloud.net/cloud-certs/CA.pem" \
         --output-document ~/.postgresql/root.crt && \
    chmod 0600 ~/.postgresql/root.crt


CMD java -jar ./build/libs/backend-0.0.1-SNAPSHOT.jar