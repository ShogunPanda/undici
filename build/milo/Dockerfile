FROM node:21-alpine@sha256:577f8eb599858005100d84ef3fb6bd6582c1b6b17877a393cdae4bfc9935f068

ARG UID=1000
ARG GID=1000

WORKDIR /home/node/undici
COPY build.sh /usr/local/bin/build-milo
RUN chmod a+x /usr/local/bin/build-milo