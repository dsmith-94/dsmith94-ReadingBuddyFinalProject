import { useState } from "react";
import { format, parseISO } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListBooks,
  useCreateBook,
  getListBooksQueryKey,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Book, PlusCircle, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().optional(),
  genre: z.string().optional(),
  totalPages: z.coerce.number().min(1, "Total pages must be greater than 0"),
  targetCompletionDate: z.string().optional(),
});

type BookFormValues = z.infer<typeof bookSchema>;

export default function MyBooks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("reading");

  const { data: readingBooks, isLoading: readingLoading } = useListBooks({ status: "reading" });
  const { data: completedBooks, isLoading: completedLoading } = useListBooks({ status: "completed" });
  
  const createBook = useCreateBook();

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: "",
      author: "",
      genre: "",
      totalPages: 0,
      targetCompletionDate: "",
    },
  });

  function onSubmit(values: BookFormValues) {
    // Convert empty string to null/undefined for the API
    const submissionData = {
      ...values,
      targetCompletionDate: values.targetCompletionDate || undefined
    };

    createBook.mutate(
      { data: submissionData },
      {
        onSuccess: () => {
          toast({
            title: "Book added!",
            description: "Your new book has been added to your library.",
          });
          form.reset();
          setActiveTab("reading");
          queryClient.invalidateQueries({ queryKey: getListBooksQueryKey({ status: "reading" }) });
          queryClient.invalidateQueries({ queryKey: getListBooksQueryKey({ status: "all" }) });
        },
        onError: () => {
          toast({
            title: "Failed to add book",
            description: "Please try again later.",
            variant: "destructive",
          });
        },
      }
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif font-bold text-foreground">My Library</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full sm:w-[400px] grid-cols-3 mb-8 bg-muted/50 rounded-full p-1">
          <TabsTrigger value="reading" className="rounded-full data-[state=active]:bg-card data-[state=active]:shadow-sm">Reading</TabsTrigger>
          <TabsTrigger value="completed" className="rounded-full data-[state=active]:bg-card data-[state=active]:shadow-sm">Completed</TabsTrigger>
          <TabsTrigger value="add" className="rounded-full data-[state=active]:bg-card data-[state=active]:shadow-sm">Add Book</TabsTrigger>
        </TabsList>

        <TabsContent value="reading" className="mt-0 space-y-4">
          {readingLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          ) : readingBooks?.length === 0 ? (
            <Card className="border-dashed border-2 border-muted-foreground/30 bg-transparent shadow-none">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Book className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-serif text-xl font-medium text-foreground mb-2">No books in progress</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-sm">
                  Add a book you're currently reading to start tracking your progress.
                </p>
                <Button onClick={() => setActiveTab("add")} className="rounded-full">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add a Book
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {readingBooks?.map((book) => {
                const percentComplete = Math.min(100, Math.round((book.pagesRead / book.totalPages) * 100));
                
                return (
                  <Card key={book.id} className="overflow-hidden border-card-border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-serif text-lg font-semibold text-foreground line-clamp-1">{book.title}</h3>
                          {book.author && <p className="text-sm text-muted-foreground">by {book.author}</p>}
                        </div>
                        {book.genre && (
                          <span className="text-[10px] uppercase tracking-wider font-semibold bg-secondary/10 text-secondary-foreground px-2 py-1 rounded-full text-foreground whitespace-nowrap">
                            {book.genre}
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2 mt-6">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-foreground">{book.pagesRead} pages</span>
                          <span className="text-muted-foreground">{percentComplete}%</span>
                        </div>
                        <Progress value={percentComplete} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground pt-1">
                          <span>0</span>
                          <span>{book.totalPages} pages</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-0 space-y-4">
          {completedLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          ) : completedBooks?.length === 0 ? (
            <Card className="border-dashed border-2 border-muted-foreground/30 bg-transparent shadow-none">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-serif text-xl font-medium text-foreground mb-2">No books completed yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Keep reading! Your finished books will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {completedBooks?.map((book) => (
                <Card key={book.id} className="border-card-border shadow-sm bg-muted/20">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <CheckCircle2 className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <h3 className="font-serif text-base font-semibold text-foreground line-clamp-1">{book.title}</h3>
                        {book.author && <p className="text-xs text-muted-foreground">by {book.author}</p>}
                        <p className="text-[10px] text-muted-foreground mt-2 uppercase font-medium">
                          Finished {book.completedAt ? format(parseISO(book.completedAt), "MMM d, yyyy") : "Unknown"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="add" className="mt-0">
          <Card className="max-w-2xl mx-auto border-card-border shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-card-border pb-4">
              <CardTitle className="font-serif text-xl">Add a New Book</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Book Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="The Great Gatsby" className="rounded-full px-4 border-muted-foreground/20 bg-background focus:ring-primary/20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="author"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Author</FormLabel>
                          <FormControl>
                            <Input placeholder="F. Scott Fitzgerald" className="rounded-full px-4 border-muted-foreground/20 bg-background focus:ring-primary/20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="genre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Genre</FormLabel>
                          <FormControl>
                            <Input placeholder="Classic Fiction" className="rounded-full px-4 border-muted-foreground/20 bg-background focus:ring-primary/20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="totalPages"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Pages *</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="218" className="rounded-full px-4 border-muted-foreground/20 bg-background focus:ring-primary/20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="targetCompletionDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Completion Date</FormLabel>
                          <FormControl>
                            <Input type="date" className="rounded-full px-4 border-muted-foreground/20 bg-background focus:ring-primary/20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      disabled={createBook.isPending}
                      className="w-full sm:w-auto rounded-full px-8 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                    >
                      {createBook.isPending ? "Adding..." : "Add to Library"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
