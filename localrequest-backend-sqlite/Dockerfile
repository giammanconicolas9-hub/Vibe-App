FROM node:18-alpine

WORKDIR /app

# Copia package.json
COPY package.json ./

# Installa dipendenze
RUN npm install

# Copia codice
COPY . .

# Crea cartella data
RUN mkdir -p data

# Espone porta
EXPOSE 3000

# Avvia server
CMD ["node", "server.js"]
