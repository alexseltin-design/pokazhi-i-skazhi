# Настройка Firebase для синхронизации голоса

Нужно сделать один раз. Займёт около 10 минут.

1. Откройте https://console.firebase.google.com и нажмите «Создать проект» (Add project).
   Название, например, `pokazhi-i-skazhi`. **Google Analytics — выключить** (для детского приложения он не нужен).
2. Слева: **Build → Authentication → Get started → Sign-in method → Anonymous → Enable → Save.**
   Это «анонимный вход»: устройство получает невидимый пропуск, никаких логинов для родителей.
3. Слева: **Build → Firestore Database → Create database.**
   Режим: **Production mode**. Расположение: например, `eur3 (europe-west)`.
4. В Firestore откройте вкладку **Rules**, удалите всё и вставьте содержимое файла `firestore.rules` из проекта. Нажмите **Publish**.
5. Шестерёнка → **Project settings → General → Your apps → значок `</>` (Web)**.
   Название приложения — любое, Firebase Hosting **не** включать. Нажмите «Register app».
6. Вы увидите блок `const firebaseConfig = { ... }`. Скопируйте значения в файл `js/sync-config.js`
   вместо `null` (пример есть в самом файле). Эти ключи не секретные, их можно хранить на GitHub.
7. **Authentication → Settings → Authorized domains → Add domain:** `alexseltin-design.github.io`.
8. Запустите `python3 tools/build.py` и загрузите проект на GitHub.

Бесплатного тарифа (Spark) хватает с запасом: записи одной семьи занимают около 20 МБ, а бесплатно доступен 1 ГБ.
Платёжная карта не нужна.
