import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, User, Clock, BookOpen, PlayCircle, FileText, HelpCircle, Award, Users, Play, Heart, CheckCircle } from 'lucide-react';
import EnrollmentButton from '@/components/enrollment/enrollment-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

interface Course {
    id: number;
    title: string;
    slug: string;
    description: string;
    objectives: string | null;
    price: number;
    duration_hours: number;
    difficulty_level: string;
    thumbnail: string | null;
    instructor: {
        id: number;
        name: string;
        email: string;
    };
    category: {
        id: number;
        name: string;
    };
    lessons: Array<{
        id: number;
        title: string;
        description: string | null;
        type: string;
        order: number;
        estimated_duration: number;
        duration_display: string;
    }>;
    created_at: string;
}

interface Props {
    course: Course;
    enrollmentStatus: {
        id: number;
        payment_status: string;
        status: string;
        progress: number;
        completion_date: string | null;
    } | null;
    isWishlisted: boolean;
    stats: {
        total_lessons: number;
        total_enrollments: number;
        lesson_types: Record<string, number>;
    };
    user: {
        id: number;
        role: string;
    } | null;
}

export default function Show({ course, enrollmentStatus, isWishlisted, stats, user }: Props) {
    const getDifficultyBadgeColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Beginner': return 'bg-green-100 text-green-800';
            case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
            case 'Advanced': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const toggleWishlist = () => {
        router.post('/student/wishlist/toggle', {
            course_id: course.id
        }, {
            preserveScroll: true
        });
    };

    const getLessonIcon = (type: string) => {
        switch (type) {
            case 'Video': return <PlayCircle className="h-4 w-4" />;
            case 'Text': return <FileText className="h-4 w-4" />;
            case 'Quiz': return <HelpCircle className="h-4 w-4" />;
            case 'Assignment': return <Award className="h-4 w-4" />;
            default: return <BookOpen className="h-4 w-4" />;
        }
    };

    const getLessonTypeColor = (type: string) => {
        switch (type) {
            case 'Video': return 'text-blue-600';
            case 'Text': return 'text-gray-600';
            case 'Quiz': return 'text-green-600';
            case 'Assignment': return 'text-purple-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/student/dashboard' },
            { title: 'Course Catalog', href: '/student/courses' },
            { title: course.title, href: '#' }
        ]}>
            <Head title={course.title} />

            <div className="space-y-6">
                {/* Back Button */}
                <div className="flex items-center justify-between">
                    <Link href="/student/courses">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Courses
                        </Button>
                    </Link>

                    {user && (
                        <Button
                            variant="outline"
                            onClick={toggleWishlist}
                            className={cn(
                                "rounded-xl transition-all duration-300",
                                isWishlisted 
                                    ? "bg-rose-50 text-rose-600 border-rose-200" 
                                    : "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                            )}
                        >
                            <Heart className={cn("h-4 w-4 mr-2", isWishlisted && "fill-current")} />
                            {isWishlisted ? 'Saved to Wishlist' : 'Save for Later'}
                        </Button>
                    )}
                </div>

                {/* Course Header */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Course Info */}
                        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                            <CardContent className="pt-6">
                                {course.thumbnail && (
                                    <div className="aspect-video bg-gray-100 rounded-2xl mb-6 overflow-hidden shadow-inner">
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                
                                <div className="space-y-4">
                                    <div>
                                        <h1 className="text-3xl font-black mb-2 text-slate-900 leading-tight">{course.title}</h1>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-none font-bold uppercase text-[10px] tracking-widest">{course.category.name}</Badge>
                                            <Badge className={cn("border-none font-bold uppercase text-[10px] tracking-widest", getDifficultyBadgeColor(course.difficulty_level))}>
                                                {course.difficulty_level}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm font-bold text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs">
                                                {course.instructor.name.charAt(0)}
                                            </div>
                                            {course.instructor.name}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="h-4 w-4 text-slate-400" />
                                            {course.duration_hours} hours
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <BookOpen className="h-4 w-4 text-slate-400" />
                                            {stats.total_lessons} lessons
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Users className="h-4 w-4 text-slate-400" />
                                            {stats.total_enrollments} students
                                        </div>
                                    </div>

                                    <Separator className="bg-slate-50" />

                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 mb-2 uppercase tracking-widest text-[10px]">Description</h3>
                                        <p className="text-slate-600 leading-relaxed font-medium">
                                            {course.description}
                                        </p>
                                    </div>

                                    {course.objectives && (
                                        <>
                                            <Separator className="bg-slate-50" />
                                            <div>
                                                <h3 className="text-lg font-black text-slate-800 mb-2 uppercase tracking-widest text-[10px]">Learning Objectives</h3>
                                                <p className="text-slate-600 leading-relaxed font-medium">
                                                    {course.objectives}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Course Content */}
                        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                <CardTitle className="text-lg font-black text-slate-800">Course Content</CardTitle>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    {stats.total_lessons} modules • {course.duration_hours} hours total
                                </p>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {course.lessons.length > 0 ? (
                                    <div className="space-y-3">
                                        {course.lessons.map((lesson, index) => (
                                            <div key={lesson.id} className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors group">
                                                <div className="flex-shrink-0">
                                                    <div className={cn("h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center transition-colors group-hover:bg-white", getLessonTypeColor(lesson.type))}>
                                                        {getLessonIcon(lesson.type)}
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-slate-800">
                                                            {index + 1}. {lesson.title}
                                                        </span>
                                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-slate-200 text-slate-400 bg-white">
                                                            {lesson.type}
                                                        </Badge>
                                                    </div>
                                                    {lesson.description && (
                                                        <div className="text-xs font-medium text-slate-500 mt-1 line-clamp-1">
                                                            {lesson.description}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                        <span>{lesson.duration_display}</span>
                                                        {lesson.estimated_duration > 0 && (
                                                            <span>• Estimated {lesson.estimated_duration} mins</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <BookOpen className="h-12 w-12 mx-auto text-slate-200 mb-4" />
                                        <p className="text-slate-400 font-bold">No lessons available yet</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {enrollmentStatus && enrollmentStatus.status === 'Active' && enrollmentStatus.payment_status !== 'Pending' ? (
                            <Card className="border-none shadow-xl rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white overflow-hidden relative group">
                                <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-colors"></div>
                                <CardContent className="p-6 space-y-6 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black text-indigo-100 uppercase tracking-[0.2em]">Your Progress</div>
                                            <div className="text-4xl font-black tracking-tight">{Number(enrollmentStatus.progress || 0).toFixed(0)}%</div>
                                        </div>
                                        <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                            <Award className="h-8 w-8 text-white" />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-white rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                                                style={{ width: `${enrollmentStatus.progress}%` }}
                                            ></div>
                                        </div>
                                        {enrollmentStatus.completion_date && (
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-100 uppercase tracking-wider">
                                                <CheckCircle className="h-3 w-3" />
                                                Completed on {new Date(enrollmentStatus.completion_date).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>

                                    <Link href={`/student/enrollments/${enrollmentStatus.id}`} className="block">
                                        <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-black rounded-2xl h-12 shadow-xl shadow-indigo-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] border-none" size="lg">
                                            <Play className="h-4 w-4 mr-2 fill-current" />
                                            Resume Learning
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ) : (
                            /* Enrollment Card for non-enrolled or pending */
                            <div className="space-y-4">
                                <EnrollmentButton 
                                    course={{
                                        id: course.id,
                                        title: course.title,
                                        price: course.price,
                                        status: 'Published'
                                    }}
                                    user={user || undefined}
                                    initialEnrollment={enrollmentStatus}
                                    className="w-full"
                                />
                            </div>
                        )}

                        {/* Course Stats */}
                        <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100/80 px-6 py-4">
                                <CardTitle className="text-xs font-black text-slate-800 uppercase tracking-[0.15em]">Course Statistics</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lessons</div>
                                        <div className="font-black text-slate-800 flex items-center gap-1.5">
                                            <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                                            {stats.total_lessons}
                                        </div>
                                    </div>
                                    <div className="space-y-1 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Students</div>
                                        <div className="font-black text-slate-800 flex items-center gap-1.5">
                                            <Users className="h-3.5 w-3.5 text-violet-500" />
                                            {stats.total_enrollments}
                                        </div>
                                    </div>
                                    <div className="space-y-1 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration</div>
                                        <div className="font-black text-slate-800 flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5 text-amber-500" />
                                            {course.duration_hours}h
                                        </div>
                                    </div>
                                    <div className="space-y-1 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Level</div>
                                        <div className="font-black text-slate-800 text-xs truncate">
                                            {course.difficulty_level}
                                        </div>
                                    </div>
                                </div>
                                
                                {Object.keys(stats.lesson_types).length > 0 && (
                                    <div className="space-y-4 pt-2">
                                        <div className="flex items-center gap-2">
                                            <Separator className="flex-1 bg-slate-100" />
                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Breakdown</span>
                                            <Separator className="flex-1 bg-slate-100" />
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {Object.entries(stats.lesson_types).map(([type, count]) => (
                                                <div key={type} className="flex justify-between items-center p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "h-2 w-2 rounded-full",
                                                            type === 'Video' ? 'bg-blue-400' :
                                                            type === 'Quiz' ? 'bg-emerald-400' :
                                                            type === 'Assignment' ? 'bg-purple-400' : 'bg-slate-300'
                                                        )}></div>
                                                        <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{type}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-slate-400 group-hover:text-indigo-600 transition-colors bg-slate-100 group-hover:bg-indigo-50 px-2 py-0.5 rounded-md">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Instructor Info */}
                        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest">Instructor</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-black">
                                        {course.instructor.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-black text-slate-800 truncate">{course.instructor.name}</p>
                                        <p className="text-xs font-bold text-slate-400 truncate">{course.instructor.email}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
