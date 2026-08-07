# Backend — Floor Plan Editor

Spring Boot REST API для редактора планов этажей.

## Стек

- Java 17
- Spring Boot 3.3
- PostgreSQL + Flyway
- PDFBox (метаданные PDF)
- Локальное хранение PDF (без S3)

## Запуск

```bash
# 1. PostgreSQL
docker compose up -d

# 2. API
mvn spring-boot:run
```

- API: http://localhost:8080
- Swagger: http://localhost:8080/swagger-ui.html

PDF хранятся локально в `~/.vizualizator/storage/`.
Скачивание через `GET /api/files/{floorId}/pdf`.

## API

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/buildings` | Создать здание |
| GET | `/api/buildings` | Список зданий |
| GET | `/api/buildings/{id}` | Здание с этажами |
| POST | `/api/floors` | Загрузить PDF (multipart) |
| GET | `/api/floors/{id}` | Этаж с комнатами |
| GET | `/api/floors?buildingId=` | Этажи здания |
| PATCH | `/api/floors/{id}` | Обновить (калибровка) |
| DELETE | `/api/floors/{id}` | Удалить этаж |
| POST | `/api/spaces` | Создать комнату |
| PATCH | `/api/spaces/{id}` | Обновить комнату |
| DELETE | `/api/spaces/{id}` | Удалить комнату |
| GET | `/api/spaces/{id}` | Комната |
| GET | `/api/files/{floorId}/pdf` | PDF этажа |

## Конфигурация

```yaml
app:
  storage:
    base-path: ${user.home}/.vizualizator/storage
    public-base-url: /api/files
```
