# Imagen base para desarrollo
FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el código fuente
COPY . .

# Exponer el puerto
EXPOSE 3000

# Ejecutar modo desarrollo de Next.js con turbopack
CMD ["npm", "run", "dev"]
