# Инструкция по тестированию — Floor Plan Editor

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
npm install

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

1. На странице здания перетащите PDF в зону загрузки (или нажмите **browse**)
2. Заполните:
   - Floor name: `Floor 1`
   - Floor number: `1`
   - PDF page: `1` (нумерация с единицы, как в просмотрщике PDF)
3. Нажмите **Upload & open editor**
4. Должен открыться редактор `/floors/{id}/edit` с отображением PDF

### Шаг 3 — Навигация по плану

| Действие | Как |
|----------|-----|
| Zoom | Колёсико мыши, кнопки `+` / `−` внизу справа или клавиши `+` / `-` |
| Pan | Перетаскивание по пустому месту, Space + drag, Alt + drag или средняя кнопка |
| Fit page | Клавиша `F` или кнопка в статус-баре |
| Fit width | `Shift + F` |
| Сбросить масштаб | Клик по проценту зума в статус-баре |

Масштаб сохраняется при изменении размера окна и переключении панелей.

### Шаг 4 — Нарисовать комнату

1. Нажмите клавишу `D` (или кнопку **Draw** в панели Rooms)
2. Кликайте по углам комнаты на плане (минимум 3 точки)
3. Завершите полигон одним из способов:
   - **Enter**
   - Клик по первой (жёлтой) точке
   - Двойной клик по последней точке
4. Справа откроется панель **New room**: номер подставляется автоматически
5. Нажмите **Create room**
6. Комната появится на плане зелёным полигоном и в списке слева

Ошибки валидации (самопересечение, меньше трёх точек) показываются всплывающим уведомлением.

### Шаг 5 — Редактирование свойств

1. Нажмите `S` (Select) и кликните по комнате — либо выберите её в списке слева
2. Справа откроется панель свойств
3. Измените имя или статус → **Save changes**
4. Цвет полигона изменится (Occupied = красный и т.д.)

Изменения геометрии сохраняются автоматически; индикатор в шапке показывает
`N unsaved` → `All changes saved`. `Ctrl/Cmd + S` сохраняет немедленно.

### Шаг 6 — Калибровка масштаба

1. Нажмите `C` (Set scale)
2. Кликните две точки на плане с известным расстоянием (например, длина стены)
3. Введите расстояние в метрах (например `10`)
4. Нажмите **Apply**
5. В свойствах комнат появится **Geometric area** в м²

### Шаг 7 — Проверка сохранения

1. Обновите страницу редактора (F5)
2. PDF и все комнаты должны загрузиться снова
3. Или вернитесь на `/buildings/{id}` → **Edit** на этаже

---

## 4. Горячие клавиши

Полный список открывается клавишей `?` прямо в редакторе.

| Клавиша | Действие |
|---------|----------|
| `V` / `S` / `D` / `E` / `C` | Pan / Select / Draw / Edit shape / Set scale |
| `Space` + drag | Временный pan в любом режиме |
| Enter | Завершить полигон (≥3 точек) |
| Backspace | Удалить последнюю точку |
| Esc | Отменить полигон или снять выделение |
| Delete | Удалить выбранную комнату |
| `F` / `Shift + F` | Fit page / Fit width |
| `+` / `-` | Zoom in / out |
| `B` | Показать или скрыть панель Rooms |
| `Ctrl/Cmd + Z` | Undo (откат также сохраняется на сервере) |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + S` | Сохранить изменения |

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
| Backend не подключается к БД | `docker-compose.yml` создаёт пользователя `vizualizator`, а `application.yml` подключается как `postgres/postgres` — совместите их |
| `port 5432 already in use` | На хосте уже запущен PostgreSQL — остановите его или смените порт в `docker-compose.yml` и `SPRING_DATASOURCE_URL` |
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
