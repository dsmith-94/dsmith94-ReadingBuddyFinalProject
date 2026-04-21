import { format, parseISO } from "date-fns";
import { useGetGoals } from "@workspace/api-client-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody as Body,
  TableCell as Cell,
  TableHead as Head,
  TableHeader as Header,
  TableRow as Row,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Calendar, Activity } from "lucide-react";

export default function Goals() {
  const { data: goals, isLoading } = useGetGoals();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-serif font-bold text-foreground">Reading Goals</h2>
        <p className="text-muted-foreground">Track your pace and estimated completion dates.</p>
      </div>

      <Card className="border-card-border shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-card-border">
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            Current Trajectories
          </CardTitle>
          <CardDescription>Based on your reading history over the last 14 days.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : goals?.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground italic">
              No active books or reading data to calculate goals yet.
            </div>
          ) : (
            <Table>
              <Header>
                <Row className="bg-muted/10">
                  <Head className="font-semibold py-4 pl-6">Book</Head>
                  <Head className="font-semibold py-4">Progress</Head>
                  <Head className="font-semibold py-4">Pace</Head>
                  <Head className="font-semibold py-4 pr-6">Estimated Finish</Head>
                </Row>
              </Header>
              <Body>
                {goals?.map((goal) => (
                  <Row key={goal.bookId} className="hover:bg-muted/5 transition-colors border-b border-border/50">
                    <Cell className="font-serif font-medium py-4 pl-6">
                      {goal.bookTitle}
                    </Cell>
                    <Cell className="py-4 text-sm">
                      {goal.pagesCompleted} / {goal.totalPages}
                      <span className="text-muted-foreground ml-2 text-xs">
                        ({Math.round((goal.pagesCompleted / goal.totalPages) * 100)}%)
                      </span>
                    </Cell>
                    <Cell className="py-4">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Activity className="h-3 w-3" />
                        {Math.round(goal.avgPagesPerDay)} pg/day
                      </div>
                    </Cell>
                    <Cell className="py-4 pr-6">
                      {goal.estimatedDateCompleted ? (
                        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                          <Calendar className="h-3 w-3 text-primary" />
                          {format(parseISO(goal.estimatedDateCompleted), "MMM d, yyyy")}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Needs more data</span>
                      )}
                    </Cell>
                  </Row>
                ))}
              </Body>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
