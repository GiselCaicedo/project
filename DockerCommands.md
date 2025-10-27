Comandos para desplegar:

1. Construir e iniciar todos los servicios:
docker-compose up --build

3. Iniciar en segundo plano (detached):
docker-compose up -d --build

5. Ver logs:
docker-compose logs -f

7. Ver logs de un servicio específico:
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

9. Detener los servicios:
docker-compose down

Frontend (dev): http://localhost:3000
Backend: http://localhost:3001
