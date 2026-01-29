import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Info, Newspaper, Images, UserCog, LayoutTemplate } from "lucide-react";

export default function AdminInstructions() {
    const manuals = [
        {
            id: "news",
            title: "Работа с новостями",
            icon: Newspaper,
            content: (
                <div className="space-y-4">
                    <p>Раздел «Новости» позволяет публиковать события школы и импортировать их из социальных сетей.</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Ручное создание:</strong> Нажмите «Добавить новость», заполните заголовок, текст и загрузите обложку.</li>
                        <li><strong>Импорт из VK/Telegram:</strong> Вставьте ссылку на пост в поле импорта. Система автоматически подтянет текст и изображение.</li>
                        <li><strong>Slug:</strong> Это уникальный идентификатор для URL. Он генерируется автоматически, но его можно изменить вручную.</li>
                    </ul>
                </div>
            )
        },
        {
            id: "media",
            title: "Медиа-хранилище",
            icon: Images,
            content: (
                <div className="space-y-4">
                    <p>Все изображения сайта хранятся в облаке. Для удобства они разделены на категории (buckets).</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>images:</strong> Общие фото для разделов (Hero, О школе, Программы).</li>
                        <li><strong>news:</strong> Изображения для новостных постов.</li>
                        <li><strong>avatars:</strong> Фотографии преподавателей.</li>
                        <li><strong>Папки:</strong> Используйте «Быстрый переход» для навигации по системным папкам, чтобы не перепутать разделы.</li>
                    </ul>
                </div>
            )
        },
        {
            id: "teachers",
            title: "Преподаватели",
            icon: UserCog,
            content: (
                <div className="space-y-4">
                    <p>Здесь вы управляете списком сотрудников школы.</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>При добавлении обязательно указывайте ФИО и должность.</li>
                        <li>Фотографии лучше загружать квадратные, чтобы они корректно отображались в кружках на сайте.</li>
                    </ul>
                </div>
            )
        },
        {
            id: "sections",
            title: "Редактирование страниц",
            icon: LayoutTemplate,
            content: (
                <div className="space-y-4">
                    <p>Раздел «Секции» позволяет менять тексты и настройки блоков на главной странице.</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Hero:</strong> Заголовок и подзаголовок главного экрана.</li>
                        <li><strong>Сведения:</strong> Этот раздел предназначен для заполнения официальной информации (структура школы, документы), которая требуется по закону.</li>
                    </ul>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Helmet>
                <title>Инструкции — Панель управления</title>
            </Helmet>

            <div className="flex items-center gap-3 border-b pb-5">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Info className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Инструкции по управлению</h1>
                    <p className="text-muted-foreground text-sm">Руководство по работе с административной панелью сайта.</p>
                </div>
            </div>

            <div className="grid gap-6">
                {manuals.map((item) => (
                    <Card key={item.id} className="overflow-hidden border-none shadow-sm shadow-primary/5 bg-card">
                        <CardHeader className="bg-muted/30 pb-0">
                            <CardTitle className="flex items-center gap-3 text-lg">
                                <item.icon className="w-5 h-5 text-primary" />
                                {item.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="content" className="border-none">
                                    <AccordionTrigger className="hover:no-underline py-2 text-sm text-primary">
                                        Показать подробности
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground pt-2">
                                        {item.content}
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="p-6 border-dashed border-2 bg-primary/[0.01]">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-background rounded-lg border shadow-sm">
                        <Info className="w-5 h-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-semibold">Совет:</h4>
                        <p className="text-sm text-muted-foreground">
                            Если вы столкнулись с ошибкой при импорте, проверьте доступность ссылки в браузере. Некоторые закрытые посты VK не могут быть импортированы.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
