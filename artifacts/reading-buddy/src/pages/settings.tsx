import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun, Monitor } from "lucide-react";

const settingsSchema = z.object({
  displayName: z.string().min(1, "Name is required"),
  dailyGoal: z.coerce.number().min(1, "Goal must be at least 1 page").max(1000, "Be realistic!"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  
  // Default values before loading from storage
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      displayName: "",
      dailyGoal: 10,
    },
  });

  // Load from local storage on mount
  useEffect(() => {
    const savedName = localStorage.getItem("rb_displayName") || "Reader";
    const savedGoal = localStorage.getItem("rb_dailyGoal") || "10";
    
    form.reset({
      displayName: savedName,
      dailyGoal: parseInt(savedGoal, 10),
    });
  }, [form]);

  function onSubmit(values: SettingsFormValues) {
    localStorage.setItem("rb_displayName", values.displayName);
    localStorage.setItem("rb_dailyGoal", values.dailyGoal.toString());
    
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated.",
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <h2 className="text-3xl font-serif font-bold text-foreground">Preferences</h2>

      <Card className="border-card-border shadow-sm">
        <CardHeader className="bg-muted/30 border-b border-card-border">
          <CardTitle className="font-serif">Appearance</CardTitle>
          <CardDescription>Adjust how the app looks and feels.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-foreground">Reading Theme</h4>
              <p className="text-xs text-muted-foreground">Toggle dim sepia mode for comfortable reading.</p>
            </div>
            
            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-full border border-border/50">
              <Button 
                type="button"
                variant="ghost" 
                size="sm" 
                className={`rounded-full h-8 px-3 ${theme === "light" ? "bg-card shadow-sm" : ""}`}
                onClick={() => setTheme("light")}
              >
                <Sun className="h-4 w-4 mr-2" />
                Light
              </Button>
              <Button 
                type="button"
                variant="ghost" 
                size="sm" 
                className={`rounded-full h-8 px-3 ${theme === "dark" ? "bg-card shadow-sm" : ""}`}
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-4 w-4 mr-2" />
                Dim
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-card-border shadow-sm">
        <CardHeader className="bg-muted/30 border-b border-card-border">
          <CardTitle className="font-serif">Reading Profile</CardTitle>
          <CardDescription>Update your personal information and goals.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" className="rounded-full px-4 border-muted-foreground/20 bg-background" {...field} />
                    </FormControl>
                    <FormDescription>Used for greetings and export data.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dailyGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Page Goal</FormLabel>
                    <FormControl>
                      <Input type="number" className="rounded-full px-4 border-muted-foreground/20 bg-background max-w-[150px]" {...field} />
                    </FormControl>
                    <FormDescription>How many pages do you want to read per day?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <Button type="submit" className="rounded-full px-8">Save Profile</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
