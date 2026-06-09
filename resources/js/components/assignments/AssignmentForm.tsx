import { CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

interface Submission {
    id: number;
    status: string;
    score: number | null;
    feedback: string | null;
}

interface AssignmentFormProps {
    submission: Submission;
    maxScore: number;
    data: {
        score: string;
        feedback: string;
    };
    setData: (field: 'score' | 'feedback', value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    processing: boolean;
    errors: any;
}

export default function AssignmentForm({
    submission,
    maxScore,
    data,
    setData,
    onSubmit,
    processing,
    errors,
}: AssignmentFormProps) {
    return (
        <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-6">
            <div className="space-y-2">
                <Label
                    htmlFor="score"
                    className="flex items-center gap-2 text-xs font-black tracking-widest text-slate-500 uppercase"
                >
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    Score
                </Label>
                <div className="flex items-center gap-2">
                    <Input
                        id="score"
                        type="number"
                        min={0}
                        step="1"
                        value={data.score}
                        onChange={(e) => setData('score', e.target.value)}
                        className="h-12 w-32 rounded-xl border-slate-200 bg-slate-50 text-center text-lg font-black text-slate-700"
                    />
                    <span className="text-2xl font-black text-slate-300">
                        /
                    </span>
                    <div className="flex h-12 w-20 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 font-black text-slate-500">
                        {maxScore}
                    </div>
                </div>
                {errors.score && (
                    <p className="text-xs font-bold text-rose-500">
                        {errors.score}
                    </p>
                )}
            </div>

            <Separator className="bg-slate-100" />

            <div className="grid flex-1 gap-2">
                <Label
                    htmlFor="feedback"
                    className="flex items-center gap-2 text-xs font-black tracking-widest text-slate-500 uppercase"
                >
                    <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />
                    Feedback
                </Label>
                <Textarea
                    id="feedback"
                    value={data.feedback}
                    onChange={(e) => setData('feedback', e.target.value)}
                    className="min-h-[200px] rounded-2xl border-slate-200 p-4 leading-relaxed font-medium focus:ring-indigo-600"
                    placeholder="Feedback for the student..."
                />
                {errors.feedback && (
                    <p className="text-xs font-bold text-rose-500">
                        {errors.feedback}
                    </p>
                )}
            </div>

            <div className="mt-auto border-t border-slate-100 pt-6">
                <Button
                    type="submit"
                    disabled={processing}
                    className="h-14 w-full rounded-2xl bg-indigo-600 font-black text-white shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700"
                >
                    {processing ? (
                        <Clock className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        <CheckCircle className="mr-2 h-5 w-5" />
                    )}
                    {submission.status === 'Graded'
                        ? 'Update Grade'
                        : 'Submit Grade'}
                </Button>
            </div>
        </form>
    );
}
