import { Helmet } from "react-helmet-async";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, FileText } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Политика конфиденциальности — Личность ПЛЮС</title>
                <meta name="description" content="Политика конфиденциальности и обработки персональных данных частной школы «Личность ПЛЮС». Информация о защите ваших данных." />
                <meta name="robots" content="index, follow" />
            </Helmet>

            <Navigation />

            <main className="pt-28 pb-16">
                <div className="container mx-auto px-4 max-w-4xl">
                    <Breadcrumbs />

                    <motion.header
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12 text-center"
                    >
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6 border border-primary/20">
                            <Shield className="w-8 h-8 text-primary" aria-hidden="true" />
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
                            Политика конфиденциальности
                        </h1>
                        <p className="text-base text-muted-foreground max-w-2xl mx-auto font-medium">
                            Мы серьезно относимся к защите ваших персональных данных и соблюдаем требования законодательства РФ
                        </p>
                    </motion.header>

                    <motion.article
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-8 md:p-12 rounded-xl space-y-8"
                    >
                        <section id="general" aria-label="Общие положения">
                            <div className="flex items-center gap-3 mb-4">
                                <FileText className="w-5 h-5 text-primary" aria-hidden="true" />
                                <h2 className="text-2xl font-bold text-foreground tracking-tight">1. Общие положения</h2>
                            </div>
                            <div className="space-y-4 text-sm text-foreground/80 leading-relaxed">
                                <p>
                                    Настоящая Политика конфиденциальности персональных данных (далее — Политика) действует в отношении всей информации,
                                    которую частная школа <strong>«Личность ПЛЮС»</strong> (ИНН: указать при наличии) может получить о пользователе
                                    во время использования сайта <a href="/" className="text-primary hover:underline">lichnostplus.ru</a>.
                                </p>
                                <p>
                                    Использование сайта означает безоговорочное согласие пользователя с настоящей Политикой и указанными в ней условиями
                                    обработки его персональной информации.
                                </p>
                            </div>
                        </section>

                        <section id="data-collection" aria-label="Какие данные мы собираем">
                            <div className="flex items-center gap-3 mb-4">
                                <Eye className="w-5 h-5 text-primary" aria-hidden="true" />
                                <h2 className="text-2xl font-bold text-foreground tracking-tight">2. Какие данные мы собираем</h2>
                            </div>
                            <div className="space-y-4 text-sm text-foreground/80 leading-relaxed">
                                <p>Персональные данные, которые мы можем собирать:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Имя и фамилия</li>
                                    <li>Контактный телефон</li>
                                    <li>Адрес электронной почты</li>
                                    <li>Возраст ребенка (при заполнении формы записи)</li>
                                    <li>Информация о браузере и устройстве (автоматически)</li>
                                </ul>
                                <p>
                                    Мы собираем только ту информацию, которую вы предоставляете добровольно при заполнении форм обратной связи,
                                    записи на экскурсию или подписке на новости.
                                </p>
                            </div>
                        </section>

                        <section id="data-usage" aria-label="Как мы используем данные">
                            <div className="flex items-center gap-3 mb-4">
                                <Lock className="w-5 h-5 text-primary" aria-hidden="true" />
                                <h2 className="text-2xl font-bold text-foreground tracking-tight">3. Цели обработки данных</h2>
                            </div>
                            <div className="space-y-4 text-sm text-foreground/80 leading-relaxed">
                                <p>Мы используем ваши персональные данные для:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Связи с вами для консультации и записи на экскурсию</li>
                                    <li>Отправки информационных материалов о школе (при вашем согласии)</li>
                                    <li>Улучшения качества работы сайта и пользовательского опыта</li>
                                    <li>Выполнения обязательств по договорам об образовании</li>
                                </ul>
                                <p>
                                    Мы <strong>не передаем</strong> ваши данные третьим лицам без вашего явного согласия, за исключением случаев,
                                    предусмотренных законодательством РФ.
                                </p>
                            </div>
                        </section>

                        <section id="data-protection" aria-label="Защита данных">
                            <h2 className="text-2xl font-bold text-foreground mb-4 tracking-tight">4. Защита персональных данных</h2>
                            <div className="space-y-4 text-sm text-foreground/80 leading-relaxed">
                                <p>
                                    Мы применяем технические и организационные меры для защиты ваших данных от несанкционированного доступа,
                                    изменения, раскрытия или уничтожения:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Шифрование данных при передаче (SSL/TLS)</li>
                                    <li>Ограниченный доступ сотрудников к персональным данным</li>
                                    <li>Регулярное резервное копирование</li>
                                    <li>Соблюдение требований ФЗ-152 «О персональных данных»</li>
                                </ul>
                            </div>
                        </section>

                        <section id="user-rights" aria-label="Ваши права">
                            <h2 className="text-2xl font-bold text-foreground mb-4 tracking-tight">5. Ваши права</h2>
                            <div className="space-y-4 text-sm text-foreground/80 leading-relaxed">
                                <p>Вы имеете право:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Получать информацию о том, какие данные о вас мы храним</li>
                                    <li>Требовать исправления неточных данных</li>
                                    <li>Отозвать согласие на обработку данных в любое время</li>
                                    <li>Требовать удаления ваших данных</li>
                                </ul>
                                <p>
                                    Для реализации ваших прав свяжитесь с нами по адресу{" "}
                                    <a href="mailto:slichnost5@mail.ru" className="text-primary hover:underline font-semibold">
                                        slichnost5@mail.ru
                                    </a>{" "}
                                    или по телефону{" "}
                                    <a href="tel:+79282619928" className="text-primary hover:underline font-semibold">
                                        +7 (928) 261-99-28
                                    </a>.
                                </p>
                            </div>
                        </section>

                        <section id="cookies" aria-label="Использование cookies">
                            <h2 className="text-2xl font-bold text-foreground mb-4 tracking-tight">6. Файлы cookie</h2>
                            <div className="space-y-4 text-sm text-foreground/80 leading-relaxed">
                                <p>
                                    Наш сайт использует файлы cookie для улучшения функциональности и анализа посещаемости.
                                    Вы можете отключить cookie в настройках вашего браузера, однако это может ограничить функциональность сайта.
                                </p>
                            </div>
                        </section>

                        <section id="changes" aria-label="Изменения политики">
                            <h2 className="text-2xl font-bold text-foreground mb-4 tracking-tight">7. Изменения в политике</h2>
                            <div className="space-y-4 text-sm text-foreground/80 leading-relaxed">
                                <p>
                                    Мы оставляем за собой право вносить изменения в настоящую Политику. Актуальная версия всегда доступна на этой странице.
                                    Дата последнего обновления: <strong>29 января 2026 года</strong>.
                                </p>
                            </div>
                        </section>

                        <div className="mt-12 pt-8 border-t border-border">
                            <p className="text-sm text-muted-foreground text-center">
                                Если у вас есть вопросы по политике конфиденциальности, пожалуйста,{" "}
                                <a href="/contact" className="text-primary hover:underline font-semibold">
                                    свяжитесь с нами
                                </a>.
                            </p>
                        </div>
                    </motion.article>
                </div>
            </main>

            <Footer />
        </div>
    );
}
