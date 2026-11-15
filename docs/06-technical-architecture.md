# Техническое ТЗ для Codex

## Стек
React + TypeScript + Vite + обычный CSS (custom properties), Vitest + Testing Library для логики. Phaser и backend не использовать на первом этапе. Все значения контента — в `docs/data/lesson.v1.json`, при внедрении перенести в typed src/data/lesson.ts без изменения содержания.

## Архитектура
`src/app/App.tsx` маршрутизация сцен; `src/domain/lesson.ts` задания и типы; `src/domain/session.ts` чистый reducer/state machine; `src/components/` переиспользуемые UI; `src/scenes/` 4 сцены; `src/audio/` AudioManager; `src/storage/` versioned storage; `src/demo/` demo fixtures; `src/styles/` tokens+base.

## Модель
Session {version,sessionId,phase,questionId,optionOrderByQuestion,baselineAnswers,trainingAttempts,assessmentAnswers,hintCount,assistedCount,startedAt,finishedAt,status,sessionSeed}. `status`: ongoing/complete/incomplete/invalid_audio.
Answer {questionId,optionId,correct,skipped,assisted,attemptNumber,hintUsed,audioPlayed}. Контроль пробела: в assessment один final ответ на вопрос; в training неограниченные попытки. Ключ ответа не должен управляться индексом карты.

## Детерминированная рандомизация
Для каждого вопроса получить перестановку option IDs из seed sessionId и questionId; сохранять на время занятия. Валидировать неизменность после re-render/resume. Не менять осмысленную позицию после ошибки в том же вопросе.

## Audio
`AudioManager.play(key)` с canplay/error, replay, stop on change, пользовательский click-to-start; озвучка из локальных MP3 (после утверждения). Пока использовать manifest и явно помеченный демо-TTS только для разработки, но нельзя выдавать TTS за методически проверенную озвучку. Для отключённого звука display fallback не эквивалентен валидной педагогической проверке.

## Устойчивость/безопасность
LocalStorage только без персональных данных, ключ `forest-post.session.v1`. При сломанном JSON/старой версии — fallback/reset без падения. Для собранных ассетов нет внешних CDN. Никаких микрофонов и cookies. Защита от некорректных индексов и повторных кликов; disabled во время переходных анимаций, нет double-submit.

## Demo mode
`?demo=1`, видимая плашка и панель jump + сценарии `training-error-1`, `training-hint`, `assessment-1`, `result-good`, `result-incomplete`, `audio-error`. Demo хранится отдельно или в памяти; основной storage и метрики не затрагивает.

## UI/адаптив
По `05-design-system.md`; mobile-first, viewport-fit=cover, touch targets. Tablet/desktop без принудительного поворота. Audio replay и navigation доступны без потери фокуса.

## CI/деплой
Создать `vite.config.ts` с `base: '/forest/'`. `npm run build` → dist; GitHub Pages workflow из официальной документации Vite: checkout, Node LTS, npm ci, build, upload dist, deploy-pages. Настройка Settings→Pages→Source: GitHub Actions вручную владельцем.

## Запрещено до отдельного решения
Создание учёток детей, сторонняя аналитика, хранение записи голоса, таймеры, подписки/платежи, автоматическая оценка чтения, утверждение реальной эффективности.
