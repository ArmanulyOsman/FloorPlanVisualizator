# Инструкция по тестированию — Rentify Floor Plan Editor

Полный сценарий: backend + frontend + загрузка PDF + рисование комнат.

## Требования

- Java 17+
- Node.js 18+
- Docker Desktop (для PostgreSQL)
- Любой PDF с планом этажа (можно одностраничный)

---

## 1. Запуск backend

```bash
cd backend

# PostgreSQL
docker compose up -d

# API (порт 8080)
mvn spring-boot:run
```

Проверка:

```bash
curl http://localhost:8080/api/buildings
# Ожидается: []
```

Swagger UI: http://localhost:8080/swagger-ui.html

---

## 2. Запуск frontend

```bash
cd frontend

# Зависимости (если ещё не установлены)


# Dev-сервер (порт 3000)
npm run dev
```

Откройте: http://localhost:3000

Убедитесь, что в `.env.local` указано:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## 3. Сценарий через UI

### Шаг 1 — Создать здание

1. Откройте http://localhost:3000/buildings
2. Введите название (например `Test Building`) и адрес
3. Нажмите **Create**
4. Кликните **Open →** на созданном здании

### Шаг 2 — Загрузить PDF этажа

1. На странице здания заполните:
   - Floor name: `Floor 1`
   - Floor number: `1`
   - PDF page index: `0` (первая страница)
2. Выберите PDF-файл
3. Нажмите **Upload & Open Editor**
4. Должен открыться редактор `/floors/{id}/edit` с отображением PDF

### Шаг 3 — Навигация по плану

| Действие | Как |
|----------|-----|
| Zoom | Колёсико мыши |
| Pan | Alt + drag или drag по пустому месту в режиме Select |
| Fit page | Кнопка **Fit P** слева |
| Fit width | Кнопка **Fit W** слева |

### Шаг 4 — Нарисовать комнату

1. Нажмите **D** (Draw) на левой панели
2. Кликайте по углам комнаты на плане (минимум 3 точки)
3. Завершите полигон одним из способов:
   - **Enter**
   - Клик по первой (жёлтой) точке
4. В диалоге **Save Room** заполните:
   - Room Number: `101`
   - Room Name: `Office A`
   - Type / Status
5. Нажмите **Create Room**
6. Комната появится на плане зелёным полигоном

### Шаг 5 — Редактирование свойств

1. Переключитесь в режим **S** (Select)
2. Кликните по полигону комнаты
3. Справа откроется панель **Properties**
4. Измените имя или статус → **Save**
5. Цвет полигона изменится (Occupied = красный и т.д.)

### Шаг 6 — Калибровка масштаба

1. Режим **C** (Calibrate)
2. Кликните две точки на плане с известным расстоянием (например, длина стены)
3. Введите расстояние в метрах (например `10`)
4. Нажмите **Apply**
5. В Properties у комнаты появится **Geometric Area (m²)**

### Шаг 7 — Проверка сохранения

1. Обновите страницу редактора (F5)
2. PDF и все комнаты должны загрузиться снова
3. Или вернитесь на `/buildings/{id}` → **Edit** на этаже

---

## 4. Горячие клавиши (режим Draw)

| Клавиша | Действие |
|---------|----------|
| Enter | Завершить полигон (≥3 точек) |
| Esc | Отменить текущий полигон |
| Backspace | Удалить последнюю точку |

---

## 5. Тестирование через curl (без UI)

```bash
# Создать здание
BUILDING=$(curl -s -X POST http://localhost:8080/api/buildings \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","address":"Abay 1"}')
BUILDING_ID=$(echo $BUILDING | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

# Загрузить PDF
FLOOR=$(curl -s -X POST http://localhost:8080/api/floors \
  -F "buildingId=$BUILDING_ID" \
  -F "name=Floor 1" \
  -F "number=1" \
  -F "pdfPage=0" \
  -F "file=@/path/to/plan.pdf")
FLOOR_ID=$(echo $FLOOR | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

# Создать комнату
curl -s -X POST http://localhost:8080/api/spaces \
  -H "Content-Type: application/json" \
  -d "{
    \"floorId\":\"$FLOOR_ID\",
    \"number\":\"101\",
    \"name\":\"Office A\",
    \"type\":\"Office\",
    \"status\":\"Available\",
    \"polygon\":[{\"x\":0.1,\"y\":0.1},{\"x\":0.3,\"y\":0.1},{\"x\":0.3,\"y\":0.3}]
  }"

# Получить этаж с комнатами
curl -s http://localhost:8080/api/floors/$FLOOR_ID | python3 -m json.tool
```

---

## 6. Возможные проблемы

| Проблема | Решение |
|----------|---------|
| `Failed to fetch` в UI | Backend не запущен или CORS — проверьте порт 8080 |
| PDF не отображается | Проверьте `curl http://localhost:8080/api/files/{floorId}/pdf` — должен вернуть PDF |
| Docker error | Запустите Docker Desktop, затем `docker compose up -d` |
| Room number already exists | Используйте уникальный номер комнаты на этаже |
| Geometric Area = — | Сначала выполните калибровку (шаг 6) |

---

## 7. Production build frontend

```bash
cd frontend
npm run build
npm start
```

Приложение будет доступно на http://localhost:3000
