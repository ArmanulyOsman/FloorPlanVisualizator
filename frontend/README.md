# Frontend — Rentify Floor Plan Editor

Next.js приложение для загрузки PDF планов и рисования комнат.

## Запуск

```bash
npm install
npm run dev
```

http://localhost:3000

`.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Страницы

| Путь | Описание |
|------|----------|
| `/buildings` | Список зданий, создание |
| `/buildings/[id]` | Загрузка PDF этажа |
| `/floors/[id]/edit` | Редактор плана |

## Возможности

- PDF viewer (PDF.js) + zoom/pan
- Рисование полигонов комнат (React Konva)
- Сохранение через API
- Select + Properties panel
- Калибровка масштаба (metersPerPixel)

## Инструкция по тестированию

См. [TESTING.md](../TESTING.md) в корне проекта.
