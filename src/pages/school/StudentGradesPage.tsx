import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BookOpen, Calendar, Clock, Loader2, Info, GraduationCap, MapPin, User, Award, ClipboardCheck, TrendingUp, Filter } from "lucide-react";
import SchoolLayout from "@/components/school/SchoolLayout";
import { toast } from "sonner";

type GradeEntry = {
    id: number;
    grade: string;
    date: string;
    comment: string | null;
    teacher_assignment_id: number;
    subject_name: string;
};

type SubjectGrades = {
    subjectName: string;
    grades: GradeEntry[];
    average: number | null;
};

export default function StudentGradesPage() {
    const { userId } = useAuth();
    const [loading, setLoading] = useState(true);
    const [subjectGrades, setSubjectGrades] = useState<SubjectGrades[]>([]);

    useEffect(() => {
        if (userId) {
            fetchGrades();
        }
    }, [userId]);

    const fetchGrades = async () => {
        try {
            setLoading(true);

            // 1. Get student's class
            const { data: studentInfoRaw } = await supabase
                .from("students_info" as any)
                .select("class_id")
                .eq("student_id", userId)
                .maybeSingle();

            const studentInfo = (studentInfoRaw as any) as { class_id?: number } | null;

            if (!studentInfo) {
                setLoading(false);
                return;
            }

            // 2. Fetch all assignments for this class to ensure we show all subjects
            const { data: assignmentsRaw } = await supabase
                .from("teacher_assignments" as any)
                .select("id, subject_id, subjects(name)")
                .eq("class_id", (studentInfo as any)?.class_id);

            const assignments = (assignmentsRaw as any) as any[] | null;

            // 3. Fetch student's grades with joined subject info
            const { data: gradesData, error } = await supabase
                .from("grades" as any)
                .select("*, teacher_assignments(id, subjects(name))")
                .eq("student_id", userId)
                .order("date", { ascending: false });

            if (error) throw error;

            // 4. Group by subject
            const groupedData: Record<string, GradeEntry[]> = {};

            assignments?.forEach(a => {
                const name = (a.subjects as any)?.name || "Предмет";
                if (!groupedData[name]) groupedData[name] = [];
            });

            gradesData?.forEach((g: any) => {
                const name = g.teacher_assignments?.subjects?.name || "Предмет";
                if (!groupedData[name]) groupedData[name] = [];
                groupedData[name].push({
                    id: g.id,
                    grade: g.grade,
                    date: g.date,
                    comment: g.comment,
                    teacher_assignment_id: g.teacher_assignment_id,
                    subject_name: name
                });
            });

            const processed: SubjectGrades[] = Object.entries(groupedData).map(([name, grades]) => {
                const numericGrades = grades
                    .map(g => parseInt(g.grade))
                    .filter(v => !isNaN(v));

                const average = numericGrades.length > 0
                    ? numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length
                    : null;

                return {
                    subjectName: name,
                    grades: grades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
                    average
                };
            });

            setSubjectGrades(processed.sort((a, b) => a.subjectName.localeCompare(b.subjectName)));
        } catch (error: any) {
            toast.error("Не удалось загрузить оценки: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const getGradeStyle = (grade: string) => {
        const val = parseInt(grade);
        if (val === 5) return "bg-emerald-500 text-white border-emerald-600 shadow-emerald-100 hover:bg-emerald-600";
        if (val === 4) return "bg-blue-500 text-white border-blue-600 shadow-blue-100 hover:bg-blue-600";
        if (val === 3) return "bg-amber-500 text-white border-amber-600 shadow-amber-100 hover:bg-amber-600";
        if (val === 2) return "bg-rose-500 text-white border-rose-600 shadow-rose-100 hover:bg-rose-600";
        return "bg-slate-500 text-white border-slate-600 shadow-slate-100 hover:bg-slate-600";
    };

    if (loading) {
        return (
            <SchoolLayout title="Успеваемость">
                <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-slate-500 font-medium">Загружаем ваш табель...</p>
                </div>
            </SchoolLayout>
        );
    }

    return (
        <SchoolLayout title="Оценки и Табель">
            <Helmet>
                <title>Мои оценки | Школьный портал</title>
            </Helmet>

            <div className="grid gap-6 md:grid-cols-3 mb-8">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg shadow-blue-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-2xl">
                                < Award className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-white/80 text-xs font-bold uppercase tracking-wider">Всего оценок</p>
                                <h3 className="text-3xl font-black">
                                    {subjectGrades.reduce((acc, curr) => acc + curr.grades.length, 0)}
                                </h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none shadow-lg shadow-emerald-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-2xl">
                                < TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-white/80 text-xs font-bold uppercase tracking-wider">Лучший результат</p>
                                <h3 className="text-3xl font-black">
                                    {Math.max(...subjectGrades.map(s => s.average || 0)).toFixed(1)}
                                </h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-2 border-slate-100 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4 text-slate-900">
                            <div className="p-3 bg-slate-100 rounded-2xl">
                                < ClipboardCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Предметов</p>
                                <h3 className="text-3xl font-black">{subjectGrades.length}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-2 border-slate-100 shadow-2xl overflow-hidden rounded-[32px] bg-white">
                <CardHeader className="border-b bg-slate-50/50 p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                    <ClipboardCheck className="w-6 h-6" />
                                </div>
                                Электронный табель
                            </CardTitle>
                            <CardDescription className="mt-1 font-bold text-slate-500">
                                Текущие оценки и показатели среднего балла по предметам
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="rounded-xl font-bold gap-2">
                                <Filter className="w-4 h-4" /> Семестр
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/30 hover:bg-slate-50/30 border-b-2">
                                    <TableHead className="py-6 px-8 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 w-1/4">Предмет</TableHead>
                                    <TableHead className="py-6 px-8 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400">Оценки</TableHead>
                                    <TableHead className="py-6 px-8 text-center font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 w-32">Средний</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subjectGrades.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="py-20 text-center">
                                            <p className="text-slate-400 font-bold">Оценки еще не выставлены</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    subjectGrades.map((item) => (
                                        <TableRow key={item.subjectName} className="hover:bg-primary/[0.02] transition-colors border-b last:border-0 group">
                                            <TableCell className="py-8 px-8 align-middle">
                                                <span className="font-black text-slate-900 text-lg group-hover:text-primary transition-colors">
                                                    {item.subjectName}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-8 px-8 align-middle">
                                                <div className="flex flex-wrap gap-3">
                                                    {item.grades.length > 0 ? (
                                                        item.grades.map((g) => (
                                                            <div
                                                                key={g.id}
                                                                className={`w-10 h-10 flex items-center justify-center rounded-2xl font-black text-sm border-2 shadow-lg transition-all hover:scale-110 hover:-rotate-3 cursor-help ${getGradeStyle(g.grade)}`}
                                                                title={`${new Date(g.date).toLocaleDateString()} ${g.comment ? `: ${g.comment}` : ''}`}
                                                            >
                                                                {g.grade}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border-2 border-dashed">
                                                            Нет оценок
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-8 px-8 text-center align-middle">
                                                {item.average !== null ? (
                                                    <div className={`inline-flex items-center justify-center min-w-[60px] h-12 rounded-[20px] font-black text-lg shadow-md border-2 
                            ${item.average >= 4.5 ? 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-emerald-50' :
                                                            item.average >= 3.5 ? 'bg-blue-50 border-blue-100 text-blue-600 shadow-blue-50' :
                                                                'bg-rose-50 border-rose-100 text-rose-600 shadow-rose-50'}`}>
                                                        {item.average.toFixed(2)}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-200 text-xl font-black">—</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </SchoolLayout>
    );
}
