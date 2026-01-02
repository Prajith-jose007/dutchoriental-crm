
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { Phone, MessageSquare, Mail, User, Clock, Plus } from 'lucide-react';
import type { Task, User as UserType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface ActivityLogProps {
    leadId?: string;
    bookingId?: string;
    opportunityId?: string;
    currentUserId: string | null;
    users: UserType[];
}

export function ActivityLog({ leadId, bookingId, opportunityId, currentUserId, users }: ActivityLogProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [newType, setNewType] = useState<'Call' | 'WhatsApp' | 'Email'>('Call');
    const { toast } = useToast();

    const fetchTasks = async () => {
        if (!leadId && !bookingId && !opportunityId) return;
        setIsLoading(true);
        try {
            let url = '';
            if (leadId) url = `/api/tasks?leadId=${leadId}`;
            else if (bookingId) url = `/api/tasks?bookingId=${bookingId}`;
            else if (opportunityId) url = `/api/tasks?opportunityId=${opportunityId}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [leadId, bookingId, opportunityId]);

    const handleAddActivity = async () => {
        if (!newNote.trim()) return;

        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leadId,
                    bookingId,
                    opportunityId,
                    type: newType,
                    notes: newNote,
                    assignedTo: currentUserId,
                    status: 'Completed',
                    dueDate: new Date().toISOString()
                }),
            });

            if (res.ok) {
                setNewNote('');
                toast({ title: 'Activity logged' });
                fetchTasks();
            }
        } catch (error) {
            toast({ title: 'Failed to log activity', variant: 'destructive' });
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'Call': return <Phone className="h-4 w-4" />;
            case 'WhatsApp': return <MessageSquare className="h-4 w-4 text-green-500" />;
            case 'Email': return <Mail className="h-4 w-4" />;
            default: return <User className="h-4 w-4" />;
        }
    };

    const getUserName = (id: string | null) => {
        if (!id) return 'Unknown';
        return users.find(u => u.id === id)?.name || id;
    };

    return (
        <div className="space-y-6">
            <Card className="border-dashed border-2">
                <CardContent className="pt-6 space-y-4">
                    <div className="flex gap-4">
                        <Select value={newType} onValueChange={(val: any) => setNewType(val)}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Call">Call</SelectItem>
                                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                                <SelectItem value="Email">Email</SelectItem>
                            </SelectContent>
                        </Select>
                        <Textarea
                            placeholder="Log details of the conversation..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            className="min-h-[80px]"
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleAddActivity} disabled={!newNote.trim()}>
                            <Plus className="h-4 w-4 mr-2" /> Log Activity
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <ScrollArea className="h-[40vh]">
                <div className="space-y-4 pr-4">
                    {isLoading && <div className="text-center py-4">Loading activities...</div>}
                    {!isLoading && tasks.length === 0 && <div className="text-center py-8 text-muted-foreground italic">No activities recorded yet.</div>}
                    {tasks.map((task) => (
                        <div key={task.id} className="flex gap-4 border-l-2 border-primary/20 pl-4 py-2 relative">
                            <div className="absolute -left-[9px] top-3 h-4 w-4 rounded-full bg-white border-2 border-primary flex items-center justify-center">
                                {getIcon(task.type)}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm">{task.type} Log</span>
                                        <Badge variant="outline" className="text-[10px] h-5">{getUserName(task.assignedTo)}</Badge>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {task.createdAt ? format(parseISO(task.createdAt), 'MMM d, h:mm a') : ''}
                                    </div>
                                </div>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{task.notes}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
