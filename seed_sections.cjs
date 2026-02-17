const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwuicyhadpesklhkjxpn.supabase.co';
const serviceRoleKey = 'sb_secret_HzH8nQFmVqlvM95VQGoJnQ_y2FfA5vC';

const supabase = createClient(supabaseUrl, serviceRoleKey);

const sections = [
    {
        id: 'hero',
        section_name: 'Главный блок (Hero)',
        is_visible: true,
        content: {
            badge_text: 'Прием на 2026/27 год открыт',
            phone: '+7 (928) 261-99-28',
            lead: 'Российское образование с фокусом на результат и гармоничное развитие личности ребенка в Горячем Ключе.'
        }
    },
    { id: 'features', section_name: 'Особенности (Почему выбирают нас)', is_visible: true, content: {} },
    { id: 'about', section_name: 'О школе', is_visible: true, content: {} },
    { id: 'programs', section_name: 'Программы', is_visible: true, content: {} },
    { id: 'clubs', section_name: 'Кружки и секции', is_visible: true, content: {} },
    { id: 'testimonials', section_name: 'Отзывы (Что говорят о нас)', is_visible: true, content: {} },
    { id: 'news', section_name: 'События / Новости', is_visible: true, content: {} },
    { id: 'gallery', section_name: 'Галерея (превью на главной)', is_visible: true, content: {} },
    { id: 'contact', section_name: 'Связь с нами (Контакты)', is_visible: true, content: {} },
    { id: 'footer', section_name: 'Подвал (Footer)', is_visible: true, content: {} },
    { id: 'settings', section_name: 'Глобальные настройки', is_visible: true, content: { maintenance_mode: false } },
];

async function seed() {
    console.log('Seeding site_content...');
    for (const s of sections) {
        const { error } = await supabase.from('site_content').upsert(s, { onConflict: 'id' });
        if (error) console.error(`Error seeding ${s.id}:`, error.message);
        else console.log(`Seeded ${s.id}`);
    }
}

seed();
