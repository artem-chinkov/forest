# UX-flow и состояния

Основной маршрут: START → INTRO → BASELINE(B01–B02) → TRAINING(L01–L03) → ASSESSMENT(T01–T05) → CELEBRATION → PARENT_GATE → PARENT_REPORT.

## Структурные правила
- Четыре **главные сцены**, вложенные состояния не создают отдельные верхнеуровневые страницы.
- Старт только через действие пользователя; воспроизведение звука не запускается при неожиданной загрузке страницы.
- При перезагрузке восстановить текущую сцену и индекс задания, но активный звук остановить.
- Варианты на экране перемешать для каждого задания, сохранять выбранный seed и порядок до ответа.
- Инструкция и каждое название доступны для повторного прослушивания.
- При отказе аудио приложение честно показывает «Звук недоступен» и предлагает повторить; нельзя засчитать прохождение как валидное.
- Demo mode — отдельное состояние/namespace, с явным бейджем ДЕМО. Demo результаты не попадут в родительский отчёт нормального пути.

## Таблица переходов
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| INTRO | start | audioAvailable | BASELINE:B01 | lesson_started |
| INTRO | start | !audioAvailable | AUDIO_ERROR | no score |
| BASELINE | answer(optionId) | option valid | next baseline / TRAINING | baseline_answered |
| BASELINE | skip | not answered | next baseline / TRAINING | baseline_skipped |
| TRAINING | answer(correct) | valid | feedback_success → next | training_answered |
| TRAINING | answer(wrong) | first wrong | feedback_retry | wrongAttempt++ |
| TRAINING | answer(wrong) | second+ wrong | feedback_hint | hintUsed=true |
| TRAINING | requestHint | any | feedback_hint | hint_used |
| TRAINING | guidedContinue | assisted | next / ASSESSMENT | assisted=true |
| ASSESSMENT | answer(optionId) | no previous answer | next / CELEBRATION | assessment_answered |
| ASSESSMENT | skip | valid | next / CELEBRATION | assessment_skipped |
| ASSESSMENT | audioError | any | AUDIO_ERROR | result invalid |
| CELEBRATION | toParent | parentGate passed | PARENT_REPORT | parent_progress_opened |
| PARENT_REPORT | restart | explicit confirm | INTRO | reset session |
| ANY | resume | saved data valid | same stage | stop audio |
| ANY | reset | confirmed | INTRO | delete local session |

## Прерванная оценка
При паузе/закрытии сохранить partial как INCOMPLETE и не рассчитывать 4/5 как итоговую норму. Если ребёнок возвращается, продолжает с незавершённого Txx. Повторное прохождение после завершения — новый sessionId, без смешивания статистики.

## Родительская граница
В демо — понятный вызов «Для взрослых» с простой задачей или удержанием. Не утверждать, что такой gate защищает персональные данные. В production нужен полноценный семейный доступ и проверка приватности.

## Деморежим
Только явно открытый разработчиком (например query ?demo=1). Точки входа: intro, B01, L01, retry, hint, T01, celebration, parent-good, parent-incomplete, audio-error. Каждое демосостояние имеет фиксированные данные, без записи в обычную сессию.

Схемы: `flows/ux-flow.mmd`, `flows/state-machine.mmd`.
