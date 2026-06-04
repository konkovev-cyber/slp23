import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const ABBREVIATION_MAP = {
    "занимат. русс.яз.": "Занимательный русский язык",
    "муз. студия": "Музыкальная студия",
    "биологич. науки": "Биологические науки",
    "team up": "Team up (английский язык) гр.1",
    "юный географ": "Юный географ"
};

function createLogin(fullName) {
    const parts = fullName.trim().split(/\s+/);
    const lastName = parts[0] ? parts[0].toLowerCase() : '';
    const initials = ((parts[1] ? parts[1][0] : '') + (parts[2] ? parts[2][0] : '')).toLowerCase();
    const base = lastName + initials;
    const map = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
        'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
        'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
        'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    };
    return `${base.split('').map(char => map[char] || char).join('').replace(/[^a-z0-9]/g, '')}@slp23.ru`;
}

function normalize(str) {
    if (!str) return '';
    return str.replace(/\s+/g, ' ').trim().toLowerCase();
}

async function fixSchedule() {
    console.log("🚀 Запуск глубокого восстановления расписания...");
    const rawData = JSON.parse(fs.readFileSync('Журнал.json', 'utf8'));

    // 1. Находим класс ПЛЮС 5
    const { data: classData } = await supabase.from('school_classes').select('id').eq('name', 'ПЛЮС 5').single();
    if (!classData) throw new Error("Класс ПЛЮС 5 не найден");
    const classId = classData.id;

    // 2. Чистим старое расписание для этого класса
    console.log("🧹 Очистка старого расписания...");
    await supabase.from('schedule').delete().eq('class_id', classId);

    // 3. Собираем учителей
    const { data: profiles } = await supabase.from('profiles').select('auth_id, full_name, email');
    const getTeacherId = (teacherName) => {
        if (!teacherName) return null;
        const email = createLogin(teacherName);
        return profiles.find(p => p.email === email)?.auth_id;
    };

    // 4. Собираем маппинг Предмет -> Учитель из всех колонок "Предметы " и "Педагоги."
    const subjToTeacherName = {};
    for (const row of rawData) {
        if (row["Предметы "] && row["Педагоги."]) {
            subjToTeacherName[normalize(row["Предметы "])] = row["Педагоги."].trim();
        }
    }

    // 5. Загружаем/Создаем предметы
    console.log("📚 Проверка предметов...");
    const { data: existingSubjects } = await supabase.from('subjects').select('*');
    const subjNameToId = {};
    existingSubjects.forEach(s => subjNameToId[normalize(s.name)] = s.id);

    // Добавляем недостающие из маппинга
    for (const subjName of Object.values(ABBREVIATION_MAP)) {
        const norm = normalize(subjName);
        if (!subjNameToId[norm]) {
            const { data: newS } = await supabase.from('subjects').insert({ name: subjName }).select();
            if (newS) subjNameToId[norm] = newS[0].id;
        }
    }

    // 6. Импорт по дням
    const days = [
        { key: "понедельник", num: 1 },
        { key: "вторник", num: 2 },
        { key: "среда", num: 3 },
        { key: "четверг", num: 4 },
        { key: "Пятница", num: 5 }
    ];

    let inserted = 0;
    for (let i = 0; i < 10; i++) { // Проверяем первые 10 строк на наличие уроков
        const row = rawData[i];
        if (!row) continue;

        const timeStr = row["Время уроков"];
        if (!timeStr) continue;

        const startTime = timeStr.split('-')[0].trim().replace('.', ':') + ':00';
        const lessonNum = i + 1;

        for (const day of days) {
            let cellValue = row[day.key] || row[day.key.charAt(0).toUpperCase() + day.key.slice(1)];
            if (!cellValue) continue;

            let rawSubj = cellValue.trim();
            let normSubj = normalize(rawSubj);

            // Проверка сокращения
            if (ABBREVIATION_MAP[normSubj]) {
                rawSubj = ABBREVIATION_MAP[normSubj];
                normSubj = normalize(rawSubj);
            }

            let subjectId = subjNameToId[normSubj];
            let teacherName = subjToTeacherName[normSubj];

            // Если не нашли по точному совпадению, ищем по вхождению (fuzzy)
            if (!subjectId) {
                const bestKey = Object.keys(subjNameToId).find(k => k.includes(normSubj) || normSubj.includes(k));
                if (bestKey) {
                    subjectId = subjNameToId[bestKey];
                    teacherName = subjToTeacherName[bestKey];
                }
            }

            let teacherId = getTeacherId(teacherName);

            // Если учитель так и не найден, берем дефолтного (например, Нейлис из первой строки для русского)
            if (!teacherId && normSubj.includes('русс')) teacherId = getTeacherId('Нейлис Наталия Казимировна');
            if (!teacherId && normSubj.includes('арифм')) teacherId = getTeacherId('Феодориди Ирина Анатольевна');

            // Если все еще нет, выводим предупреждение, но не падаем (хотя в БД NOT NULL, так что это критично)
            if (!teacherId) {
                console.log(`⚠️ Не найден учитель для '${rawSubj}' (${day.key}, урок ${lessonNum})`);
                // Пропускаем, так как БД не даст вставить NULL
                continue;
            }

            const { error } = await supabase.from('schedule').insert({
                class_id: classId,
                day_of_week: day.num,
                lesson_number: lessonNum,
                start_time: startTime.padStart(8, '0'),
                subject_id: subjectId,
                teacher_id: teacherId
            });

            if (!error) inserted++;
            else console.error(`❌ Ошибка вставки (${day.key}, ${lessonNum}):`, error.message);
        }
    }

    console.log(`\n✅ Готово! Расписание восстановлено на основе Журнал.json (строк: ${inserted})`);
}

fixSchedule();
