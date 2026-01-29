import type { LucideIcon } from "lucide-react";
import { Palette, Music, Laptop, Globe, Camera, Dumbbell, Sparkles, Users } from "lucide-react";

export type ClubCategory = "creative" | "tech" | "educational" | "sports";

export type Club = {
  slug: string;
  icon: LucideIcon;
  title: string;
  age: string;
  schedule: string;
  category: ClubCategory;
  shortDescription: string;
  summary: string;
};

export const clubs: Club[] = [
  {
    slug: "art-studio",
    icon: Palette,
    title: "Художественная студия",
    age: "6-16 лет",
    schedule: "Вт, Чт 16:00-18:00",
    category: "creative",
    shortDescription: "Рисование, живопись, скульптура",
    summary:
      "Развиваем образное мышление и творческое видение. На занятиях дети пробуют разные техники, учатся работать с цветом и композицией и создают собственные проекты.",
  },
  {
    slug: "music-club",
    icon: Music,
    title: "Музыкальный кружок",
    age: "7-14 лет",
    schedule: "Пн, Ср 15:00-17:00",
    category: "creative",
    shortDescription: "Вокал, игра на инструментах",
    summary:
      "Тренируем слух, ритм и уверенное выступление. Изучаем основы вокала и знакомимся с инструментами — от простых упражнений до мини-номеров.",
  },
  {
    slug: "programming",
    icon: Laptop,
    title: "Программирование",
    age: "10-16 лет",
    schedule: "Сб 10:00-13:00",
    category: "tech",
    shortDescription: "Scratch, Python, веб-разработка",
    summary:
      "Понятно и по шагам учимся создавать игры и приложения. Сначала визуальные блоки, затем основы Python и простая веб-разработка — с упором на практику.",
  },
  {
    slug: "photo-video",
    icon: Camera,
    title: "Фото и видео",
    age: "12-16 лет",
    schedule: "Вс 14:00-17:00",
    category: "tech",
    shortDescription: "Основы фотографии и монтажа",
    summary:
      "Разбираем работу со светом и кадром, учимся снимать и монтировать короткие ролики. Итог — портфолио работ и базовые навыки контент‑производства.",
  },
  {
    slug: "travelers-club",
    icon: Globe,
    title: "Клуб путешественников",
    age: "8-14 лет",
    schedule: "Пт 16:00-18:00",
    category: "educational",
    shortDescription: "География, культура, языки",
    summary:
      "В интерактивном формате изучаем страны и континенты, традиции и культуру. Работаем с картами, делаем мини‑проекты и расширяем кругозор.",
  },
  {
    slug: "science-experiments",
    icon: Sparkles,
    title: "Научные эксперименты",
    age: "7-12 лет",
    schedule: "Чт 15:00-17:00",
    category: "educational",
    shortDescription: "Физика, химия, биология",
    summary:
      "Проводим безопасные опыты и объясняем «почему так». Дети учатся наблюдать, делать выводы и работать в команде, превращая науку в игру.",
  },
  {
    slug: "sports-section",
    icon: Dumbbell,
    title: "Спортивная секция",
    age: "6-16 лет",
    schedule: "Пн, Ср, Пт 17:00-19:00",
    category: "sports",
    shortDescription: "Общая физподготовка, игры",
    summary:
      "Развиваем выносливость, координацию и гибкость. Много подвижных игр и упражнений на разные группы мышц — с учётом возраста и уровня подготовки.",
  },
  {
    slug: "theatre-studio",
    icon: Users,
    title: "Театральная студия",
    age: "8-16 лет",
    schedule: "Вт, Сб 15:00-18:00",
    category: "creative",
    shortDescription: "Актёрское мастерство, постановки",
    summary:
      "Развиваем речь, пластичность и уверенность. Работаем над этюдами и небольшими постановками, учимся взаимодействовать на сцене.",
  },
];

export function getClubBySlug(slug: string) {
  return clubs.find((c) => c.slug === slug) ?? null;
}
