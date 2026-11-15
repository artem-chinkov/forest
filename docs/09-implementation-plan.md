# Этапы работы Codex (не делать всё одним шагом)

## М0 — подготовка
Прочитать AGENTS и docs. Проверить совместимость четырёх макетов, JSON, audio manifest и состояния. Создать список рисков; НЕ менять методику без согласования.

## М1 — инженерный каркас
Vite + React + TypeScript, CSS tokens, typed question schema, reducer/state machine, route phases, versioned localStorage. Запуск dev/build/test. Пустые компоненты сцен с макетной композицией.

**Acceptance:** есть все сцены и переходы, повторная загрузка стабильна.

## М2 — UI и оригинальные ассеты
Перенести SVG из `public/assets` и собрать интерфейс по четырём `wireframes/*.svg`, при этом использовать токены/состояния. Адаптив 390×844, 320×568, 1024×768, desktop center.

**Acceptance:** сравнить скриншоты с макетами, ни одна кнопка не перекрыта.

## М3 — образовательный сценарий
10 заданий из JSON; выбор карточки отдельно от аудио; baseline; training retry/hint/assisted; assessment без подсказки; scoring/skip; награда; parent report. Никакой оценки голосом.

**Acceptance:** QA04–QA14, QA19 проходят; данные согласованы.

## М4 — аудио и edge cases
AudioManager, локальные файлы (если есть) и честный демо-TTS при отсутствии; user-gesture; pause/resume; audioError; reduced motion; storage corruption; UI QA.

**Acceptance:** аудио может быть невалидировано педагогом, но UI честно маркирует; не начисляются оценки при сбое.

## М5 — demo mode и презентация
Экранный набор с переходами к важным состояниям без изменения обычных результатов. Подготовить mobile/browser display для 16:9 записи с камерой сбоку.

**Acceptance:** 4:30 walkthrough воспроизводится без ожиданий и ручного изменения JSON.

## М6 — тесты/деплой
Unit/integration smoke; npm ci / test / build; Vite base `/forest/`; GitHub Actions Pages; проверка опубликованного URL.

**Acceptance:** https://artem-chinkov.github.io/forest/ доступен после деплоя и assets загружаются.

## Запросы к Codex (по одному за этап)
1. «Ознакомься с AGENTS.md и docs/00-index.md. Реализуй только M1 из docs/09-implementation-plan.md, покажи изменённые файлы и запусти проверки».
2. «Реализуй M2 строго по docs/05-design-system.md, docs/wireframes, не изменяя JSON/методику. Сравни скриншоты на 390×844 и 1024×768».
3. «Реализуй M3 из JSON и state machine с тестами QA04–QA14. Никаких внешних сервисов».
4. «Реализуй M4 и M5, включая отказ аудио и отдельный demo mode; не меняй нормальные результаты».
5. «Реализуй M6, собери проект и настрой GitHub Pages /forest/».

## Контроль scope
Для записи видео нужен работоспособный вертикальный срез, не production платформа с аккаунтами. Если artwork/audio ещё не готовы, использовать внятные плейсхолдеры и фиксировать блокер, не заявлять готовность педагогической проверки.
