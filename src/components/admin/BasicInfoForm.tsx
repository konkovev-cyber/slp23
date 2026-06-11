import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Building2, MapPin, Phone, Mail, Globe, Clock,
    Hash, FileText, Calendar, User, Scale
} from "lucide-react";

export type BasicInfoData = {
    full_name: string;
    short_name: string;
    founder: string;
    created_date: string;
    legal_address: string;
    actual_address: string;
    phone: string;
    fax: string;
    email: string;
    website: string;
    work_hours: string;
    inn: string;
    ogrn: string;
    kpp: string;
    license_number: string;
    license_date: string;
    accreditation_number: string;
    accreditation_date: string;
    description: string;
};

export const BASIC_INFO_DEFAULTS: BasicInfoData = {
    full_name: "",
    short_name: "",
    founder: "",
    created_date: "",
    legal_address: "",
    actual_address: "",
    phone: "",
    fax: "",
    email: "",
    website: "",
    work_hours: "",
    inn: "",
    ogrn: "",
    kpp: "",
    license_number: "",
    license_date: "",
    accreditation_number: "",
    accreditation_date: "",
    description: "",
};

interface Props {
    value: BasicInfoData;
    onChange: (data: BasicInfoData) => void;
}

function Field({
    icon: Icon,
    label,
    children,
}: {
    icon: React.ElementType;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                {label}
            </Label>
            {children}
        </div>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-2 pt-2 pb-1">
            <div className="h-px flex-1 bg-border" />
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold">
                {children}
            </Badge>
            <div className="h-px flex-1 bg-border" />
        </div>
    );
}

export default function BasicInfoForm({ value, onChange }: Props) {
    const set = (key: keyof BasicInfoData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        onChange({ ...value, [key]: e.target.value });

    return (
        <div className="space-y-4">
            <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 border">
                Эти данные отображаются на публичной странице «Основные сведения» в структурированном виде.
                Заполните поля — они автоматически отформатируются красиво для посетителей.
            </p>

            {/* Наименование */}
            <SectionTitle>Наименование организации</SectionTitle>

            <Field icon={Building2} label="Полное наименование">
                <Input
                    value={value.full_name}
                    onChange={set("full_name")}
                    placeholder='Частное образовательное учреждение дополнительного образования "Личность ПЛЮС"'
                />
            </Field>

            <Field icon={Building2} label="Краткое наименование">
                <Input
                    value={value.short_name}
                    onChange={set("short_name")}
                    placeholder='ЧОУ ДО "Личность ПЛЮС"'
                />
            </Field>

            <div className="grid grid-cols-2 gap-3">
                <Field icon={User} label="Учредитель">
                    <Input
                        value={value.founder}
                        onChange={set("founder")}
                        placeholder="Иванов Иван Иванович"
                    />
                </Field>
                <Field icon={Calendar} label="Дата создания">
                    <Input
                        type="date"
                        value={value.created_date}
                        onChange={set("created_date")}
                    />
                </Field>
            </div>

            <Field icon={FileText} label="Описание организации">
                <Textarea
                    value={value.description}
                    onChange={set("description")}
                    placeholder="Краткое описание деятельности организации..."
                    className="min-h-[80px] resize-none text-sm"
                />
            </Field>

            {/* Адреса */}
            <SectionTitle>Адреса и контакты</SectionTitle>

            <Field icon={MapPin} label="Юридический адрес">
                <Input
                    value={value.legal_address}
                    onChange={set("legal_address")}
                    placeholder="123456, Москва, ул. Примерная, д. 1"
                />
            </Field>

            <Field icon={MapPin} label="Фактический адрес (место нахождения)">
                <Input
                    value={value.actual_address}
                    onChange={set("actual_address")}
                    placeholder="123456, Москва, ул. Примерная, д. 1, оф. 101"
                />
            </Field>

            <div className="grid grid-cols-2 gap-3">
                <Field icon={Phone} label="Телефон">
                    <Input
                        value={value.phone}
                        onChange={set("phone")}
                        placeholder="+7 (495) 000-00-00"
                    />
                </Field>
                <Field icon={Phone} label="Факс">
                    <Input
                        value={value.fax}
                        onChange={set("fax")}
                        placeholder="+7 (495) 000-00-00"
                    />
                </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <Field icon={Mail} label="Электронная почта">
                    <Input
                        type="email"
                        value={value.email}
                        onChange={set("email")}
                        placeholder="info@school.ru"
                    />
                </Field>
                <Field icon={Globe} label="Сайт">
                    <Input
                        value={value.website}
                        onChange={set("website")}
                        placeholder="https://school.ru"
                    />
                </Field>
            </div>

            <Field icon={Clock} label="Режим и график работы">
                <Input
                    value={value.work_hours}
                    onChange={set("work_hours")}
                    placeholder="Пн–Пт: 09:00–19:00, Сб: 10:00–15:00"
                />
            </Field>

            {/* Реквизиты */}
            <SectionTitle>Реквизиты</SectionTitle>

            <div className="grid grid-cols-3 gap-3">
                <Field icon={Hash} label="ИНН">
                    <Input
                        value={value.inn}
                        onChange={set("inn")}
                        placeholder="7700000000"
                        maxLength={12}
                    />
                </Field>
                <Field icon={Hash} label="ОГРН">
                    <Input
                        value={value.ogrn}
                        onChange={set("ogrn")}
                        placeholder="1234567890123"
                        maxLength={15}
                    />
                </Field>
                <Field icon={Hash} label="КПП">
                    <Input
                        value={value.kpp}
                        onChange={set("kpp")}
                        placeholder="770001001"
                        maxLength={9}
                    />
                </Field>
            </div>

            {/* Лицензия и аккредитация */}
            <SectionTitle>Лицензия и аккредитация</SectionTitle>

            <div className="grid grid-cols-2 gap-3">
                <Field icon={Scale} label="Номер лицензии">
                    <Input
                        value={value.license_number}
                        onChange={set("license_number")}
                        placeholder="Л035-01218-77/00123456"
                    />
                </Field>
                <Field icon={Calendar} label="Дата выдачи лицензии">
                    <Input
                        type="date"
                        value={value.license_date}
                        onChange={set("license_date")}
                    />
                </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <Field icon={Scale} label="Номер аккредитации">
                    <Input
                        value={value.accreditation_number}
                        onChange={set("accreditation_number")}
                        placeholder="Серия 77А01 № 0000000"
                    />
                </Field>
                <Field icon={Calendar} label="Дата аккредитации">
                    <Input
                        type="date"
                        value={value.accreditation_date}
                        onChange={set("accreditation_date")}
                    />
                </Field>
            </div>
        </div>
    );
}
