import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListBooks,
  useCreateSession,
  useGetDailyStats,
  useGetStatsSummary,
  useGetStreak,
  useListSessions,
  getListBooksQueryKey,
  getListSessionsQueryKey,
  getGetStatsSummaryQueryKey,
  getGetDailyStatsQueryKey,
  getGetStreakQueryKey,
  getGetGoalsQueryKey
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Flame, BookOpen, Clock, CalendarDays, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const sessionSchema = z.object({
  bookId: z.coerce.number().min(1, "Please select a book"),
  pagesRead: z.coerce.number().min(1, "Must read at least 1 page"),
  notes: z.string().optional(),
});

type SessionFormValues = z.infer<typeof sessionSchema>;

export default function LogReading() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: books, isLoading: booksLoading } = useListBooks({ status: "reading" });
  const { data: stats, isLoading: statsLoading } = useGetStatsSummary();
  const { data: streak, isLoading: streakLoading } = useGetStreak();
  const { data: dailyStats, isLoading: dailyStatsLoading } = useGetDailyStats({ days: 14 });
  const { data: recentSessions, isLoading: sessionsLoading } = useListSessions({ limit: 5 });

  const createSession = useCreateSession();

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      pagesRead: 0,
      notes: "",
    },
  });

  const selectedBookId = form.watch("bookId");
  const selectedBook = useMemo(() => books?.find(b => b.id === selectedBookId), [books, selectedBookId]);

  function onSubmit(values: SessionFormValues) {
    createSession.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast({
            title: "Session logged!",
            description: "Your reading progress has been updated.",
          });
          form.reset({ bookId: values.bookId, pagesRead: 0, notes: "" });
          
          queryClient.invalidateQueries({ queryKey: getListBooksQueryKey({ status: "reading" }) });
          queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey({ limit: 5 }) });
          queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDailyStatsQueryKey({ days: 14 }) });
          queryClient.invalidateQueries({ queryKey: getGetStreakQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetGoalsQueryKey() });
        },
        onError: () => {
          toast({
            title: "Failed to log session",
            description: "Please try again later.",
            variant: "destructive",
          });
        },
      }
    );
  }

  const isLoading = booksLoading || statsLoading || streakLoading || dailyStatsLoading || sessionsLoading;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Top Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4 sm:p-6 flex flex-col items-center justify-center text-center">
            <BookOpen className="h-6 w-6 text-primary mb-2" />
            <p className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
              {isLoading ? <Skeleton className="h-8 w-16" /> : stats?.pagesToday || 0}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wide font-semibold mt-1">Pages Today</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 sm:p-6 flex flex-col items-center justify-center text-center">
            <CalendarDays className="h-6 w-6 text-secondary mb-2" />
            <p className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
              {isLoading ? <Skeleton className="h-8 w-16" /> : stats?.pagesThisWeek || 0}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wide font-semibold mt-1">This Week</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 sm:p-6 flex flex-col items-center justify-center text-center">
            <Flame className="h-6 w-6 text-accent mb-2" />
            <p className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
              {isLoading ? <Skeleton className="h-8 w-16" /> : streak?.currentStreak || 0}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wide font-semibold mt-1">Day Streak</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 sm:p-6 flex flex-col items-center justify-center text-center">
            <TrendingUp className="h-6 w-6 text-primary mb-2" />
            <p className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
              {isLoading ? <Skeleton className="h-8 w-16" /> : Math.round(stats?.avgPagesPerDay || 0)}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wide font-semibold mt-1">Avg/Day</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        
        {/* Main Logging Area */}
        <div className="md:col-span-7 space-y-6">
          <Card className="border-card-border overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-card-border pb-4">
              <CardTitle className="font-serif text-2xl text-foreground">Log Reading Session</CardTitle>
              <CardDescription>Track your progress and keep the momentum going.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              
              {books?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">You aren't reading any books right now.</p>
                  <Button asChild variant="outline" className="rounded-full">
                    <a href="/my-books">Add a Book</a>
                  </Button>
                </div>
              ) : (
                <Tabs defaultValue="quick" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 rounded-full p-1">
                    <TabsTrigger value="quick" className="rounded-full data-[state=active]:bg-card data-[state=active]:shadow-sm">Quick Log</TabsTrigger>
                    <TabsTrigger value="detailed" className="rounded-full data-[state=active]:bg-card data-[state=active]:shadow-sm">Detailed Log</TabsTrigger>
                  </TabsList>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="bookId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Which book did you read?</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value?.toString() || ""}>
                              <FormControl>
                                <SelectTrigger className="rounded-full border-muted-foreground/20 bg-background h-12 px-4 focus:ring-primary/20">
                                  <SelectValue placeholder="Select a book" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {books?.map((book) => (
                                  <SelectItem key={book.id} value={book.id.toString()}>
                                    <span className="font-serif italic">{book.title}</span>
                                    {book.author && <span className="text-muted-foreground text-xs ml-2">by {book.author}</span>}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                            
                            {selectedBook && selectedBook.targetCompletionDate && (
                              <p className="text-xs text-muted-foreground mt-2 pl-2 flex items-center gap-1">
                                <TargetIcon className="h-3 w-3" />
                                Estimated completion: {format(parseISO(selectedBook.targetCompletionDate), "MMM d, yyyy")}
                              </p>
                            )}
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="pagesRead"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Pages read</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                className="rounded-full border-muted-foreground/20 bg-background h-12 px-4 focus:ring-primary/20 text-lg" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <TabsContent value="detailed" className="mt-0">
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground">Reading Notes (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Favorite quotes, thoughts, or plot points..." 
                                  className="resize-none border-muted-foreground/20 bg-background rounded-xl p-4 min-h-[120px] focus:ring-primary/20"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>

                      <Button 
                        type="submit" 
                        disabled={createSession.isPending}
                        className="w-full rounded-full h-14 text-lg font-medium shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                      >
                        {createSession.isPending ? "Logging..." : "Log Session"}
                      </Button>
                    </form>
                  </Form>
                </Tabs>
              )}
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <div>
            <h3 className="font-serif text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Recent Sessions
            </h3>
            <div className="space-y-3">
              {sessionsLoading ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
              ) : recentSessions?.length === 0 ? (
                <p className="text-muted-foreground text-sm italic">No sessions logged yet.</p>
              ) : (
                recentSessions?.map(session => (
                  <div key={session.id} className="bg-card border border-card-border p-4 rounded-xl shadow-sm flex items-center justify-between">
                    <div>
                      <p className="font-serif font-medium text-foreground">{session.bookTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(session.loggedAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <div className="bg-muted/50 px-3 py-1.5 rounded-lg text-sm font-semibold text-foreground">
                      +{session.pagesRead} pages
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar / Chart */}
        <div className="md:col-span-5 space-y-6">
          <Card className="shadow-sm border-card-border">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-lg">Last 14 Days</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyStatsLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : dailyStats && dailyStats.length > 0 ? (
                <div className="h-[200px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyStats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-muted-foreground)" opacity={0.2} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(val) => format(parseISO(val), "MMM d")}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                      />
                      <Tooltip 
                        cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
                        contentStyle={{ 
                          borderRadius: "8px", 
                          border: "1px solid var(--color-border)",
                          backgroundColor: "var(--color-card)",
                          color: "var(--color-card-foreground)",
                          fontSize: "12px",
                          boxShadow: "var(--shadow-sm)"
                        }}
                        labelFormatter={(val) => format(parseISO(val as string), "EEEE, MMM d, yyyy")}
                      />
                      <Bar dataKey="pages" radius={[4, 4, 0, 0]}>
                        {dailyStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.pages > 0 ? "var(--color-primary)" : "var(--color-muted)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm italic">
                  Not enough data yet.
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-secondary/10 border-secondary/20 shadow-sm">
            <CardContent className="p-6 text-center space-y-2">
              <h3 className="font-serif text-lg text-secondary-foreground font-semibold drop-shadow-sm text-foreground">Reading Tip</h3>
              <p className="text-sm text-muted-foreground italic">"Read 10 pages a day, and you'll finish a 300-page book in a month. Consistency over intensity."</p>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

function TargetIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}
