import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Teacher = {
  name: string;
  title: string;
  description: string;
  imageUrl?: string;
};

const defaultTeachers: Teacher[] = [
  {
    name: "ФИО преподавателя",
    title: "Должность / предмет",
    description: "Короткое описание опыта, квалификации и подхода к обучению.",
    imageUrl: "/placeholder.svg",
  },
  {
    name: "ФИО преподавателя",
    title: "Должность / предмет",
    description: "Короткое описание опыта, квалификации и подхода к обучению.",
    imageUrl: "/placeholder.svg",
  },
  {
    name: "ФИО преподавателя",
    title: "Должность / предмет",
    description: "Короткое описание опыта, квалификации и подхода к обучению.",
    imageUrl: "/placeholder.svg",
  },
];

export default function TeachingStaff() {
  return (
    <section aria-labelledby="teaching-staff" className="py-16">
      <div className="container mx-auto px-4">
        <header className="mb-10">
          <h2 id="teaching-staff" className="text-3xl md:text-4xl font-bold text-foreground">
            Преподавательский состав
          </h2>
          <p className="mt-3 text-muted-foreground max-w-3xl">
            Здесь вы можете разместить информацию о педагогах: предметы, квалификацию и короткую биографию.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {defaultTeachers.map((t, idx) => (
            <Card key={idx} className="overflow-hidden">
              <div className="relative h-48 bg-muted">
                <img
                  src={t.imageUrl ?? "/placeholder.svg"}
                  alt={t.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-xl">{t.name}</CardTitle>
                <div className="text-sm text-muted-foreground">{t.title}</div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
