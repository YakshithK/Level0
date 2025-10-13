FROM node:20-bullseye-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    wget ca-certificates unzip curl \
    && rm -rf /var/lib/apt/lists/*

# Install butler
RUN wget https://broth.itch.ovh/butler/linux-amd64/LATEST/archive/default -O /tmp/butler.zip \
    && unzip /tmp/butler.zip -d /tmp/ \
    && mv /tmp/butler /usr/local/bin/butler \
    && chmod +x /usr/local/bin/butler \
    && rm /tmp/butler.zip

WORKDIR /app

# Copy package files FIRST
COPY package*.json ./

# Install dependencies
RUN npm install

# NOW copy the rest of your code
COPY . .

RUN butler --version

EXPOSE 3000

CMD ["node", "simple-server.js"]