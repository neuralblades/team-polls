FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Build client (if it exists)
RUN if [ -d "client" ]; then \
    cd client && \
    npm install && \
    npm run build; \
  fi

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
