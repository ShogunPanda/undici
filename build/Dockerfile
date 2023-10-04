FROM rust:1.72.1

ARG UID=1000
ARG GID=1000

# Install wasm-pack
RUN cargo install wasm-pack

# Install the Rust required toolchain
RUN rustup toolchain install nightly

# Install Node
RUN \
  apt update -y \
  && apt install -y ca-certificates curl gnupg \
  && mkdir -p /etc/apt/keyrings \
  && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
  && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list \
  && apt update -y \
  && apt install -y nodejs

RUN apt install binaryen

WORKDIR /home/milo