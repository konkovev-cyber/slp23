import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Teacher = {
  id: string;
  name: string;
  title: string;
  description: string;
  image_url: string;
};

export default function TeachingStaff() {
  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers_public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) {
        console.error("Error fetching teachers:", error);
        return [];
      }
      return data as Teacher[];
    },
  });

  if (teachers.length === 0) return null;

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
          {teachers.map((t) => (
            <Card key={t.id} className="overflow-hidden">
              <div className="relative h-64 bg-muted">
                <img
                  src={t.image_url || "/placeholder.svg"}
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
