import { Link } from "wouter";
import {
  BookOpen,
  Target,
  Flame,
  TrendingUp,
  Calendar,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: BookOpen,
    title: "Log every page",
    body: "Drop in a book, jot down pages read, and keep a quiet record of every reading session — quick or detailed.",
  },
  {
    icon: Target,
    title: "Estimated finish dates",
    body: "Reading Buddy watches your pace and tells you when you'll finish each book — no spreadsheets required.",
  },
  {
    icon: Flame,
    title: "Streaks that stick",
    body: "A gentle daily streak keeps the momentum going, even during midterm weeks.",
  },
  {
    icon: TrendingUp,
    title: "Progress at a glance",
    body: "See pages per day, weekly totals, and which books you're actually finishing — beautifully visualized.",
  },
  {
    icon: Calendar,
    title: "Currently reading & completed",
    body: "Keep your active stack tidy and celebrate every book you close out for good.",
  },
  {
    icon: Sparkles,
    title: "Cozy by design",
    body: "Cream pages, sage greens, terracotta accents. A reading journal that feels like one.",
  },
];

const audience = [
  "Students drowning in coursework who miss reading for fun",
  "Anyone who buys books faster than they finish them",
  "Readers chasing a yearly goal with quiet consistency",
  "People who love a clean, calm, paper-feel interface",
];

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Top bar */}
      <header className="px-6 sm:px-10 py-6 flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <BookOpen className="text-primary" size={22} />
          <span className="font-serif text-xl font-bold text-foreground">
            Reading Buddy
          </span>
        </div>
        <Link href="/app">
          <Button
            variant="ghost"
            className="rounded-full text-sm font-medium hover-elevate"
          >
            Open the app
            <ArrowRight size={16} className="ml-1" />
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="px-6 sm:px-10 pt-10 pb-20 max-w-5xl w-full mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/40 border border-card-border mb-8">
          <Sparkles size={14} className="text-primary" />
          <span className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
            For students who refuse to stop reading
          </span>
        </div>

        <h1 className="font-serif text-5xl sm:text-7xl font-bold text-foreground tracking-tight leading-[1.05]">
          Protect your reading
          <br />
          <span className="text-primary italic">momentum.</span>
        </h1>

        <p className="mt-8 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Reading Buddy is a cozy little journal for college students who want
          to keep reading for pleasure — even when the syllabus says otherwise.
          Log a session, watch your streak grow, and finish more of the books
          on your nightstand.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/app">
            <Button
              size="lg"
              className="rounded-full px-8 py-6 text-base shadow-sm hover-elevate active-elevate-2"
            >
              Start your reading log
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </Link>
          <Link href="/app/my-books">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 py-6 text-base hover-elevate active-elevate-2"
            >
              Add your first book
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          No sign-up. No paywalls. Just pages.
        </p>
      </section>

      {/* Features grid */}
      <section className="px-6 sm:px-10 pb-20 max-w-6xl w-full mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
            Everything a quiet reader needs.
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Built around the rhythms of real reading — not feature checklists.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card
                key={f.title}
                className="bg-card border border-card-border rounded-2xl shadow-sm hover-elevate transition-all duration-200"
              >
                <CardContent className="p-6">
                  <div className="w-11 h-11 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-foreground mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.body}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 sm:px-10 pb-20 max-w-5xl w-full mx-auto">
        <div className="bg-card border border-card-border rounded-3xl p-8 sm:p-12 shadow-sm">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground text-center mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                n: "01",
                title: "Add a book",
                body: "Title, total pages, an optional finish date. That's it.",
              },
              {
                n: "02",
                title: "Log your sessions",
                body: "Each time you read, drop in the pages. Use Quick Log or add a note in Detailed Log.",
              },
              {
                n: "03",
                title: "Watch your goals",
                body: "Reading Buddy estimates your finish date and tracks your daily streak automatically.",
              },
            ].map((step) => (
              <div key={step.n} className="text-center sm:text-left">
                <div className="font-serif text-4xl text-primary/60 font-bold mb-3">
                  {step.n}
                </div>
                <h3 className="font-serif text-xl font-bold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audience */}
      <section className="px-6 sm:px-10 pb-20 max-w-4xl w-full mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Made for the readers who keep showing up.
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Whether you're squeezing in twenty pages between lectures or
              finally cracking that novel that's been sitting on your desk for
              a semester, Reading Buddy is here for the long, quiet game.
            </p>
          </div>
          <ul className="space-y-3">
            {audience.map((a) => (
              <li key={a} className="flex items-start gap-3">
                <CheckCircle2
                  size={20}
                  className="text-primary mt-0.5 flex-shrink-0"
                />
                <span className="text-foreground">{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 sm:px-10 pb-24 max-w-4xl w-full mx-auto">
        <div className="bg-primary/10 border border-primary/20 rounded-3xl p-10 sm:p-16 text-center shadow-sm">
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-foreground tracking-tight">
            Open a chapter today.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Your nightstand stack is waiting. Reading Buddy will be there when
            you put the next book down.
          </p>
          <Link href="/app">
            <Button
              size="lg"
              className="mt-8 rounded-full px-10 py-6 text-base shadow-sm hover-elevate active-elevate-2"
            >
              Open Reading Buddy
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-muted-foreground border-t border-card-border">
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-2">
          <a href="#" className="hover:text-primary transition-colors">
            Terms & Conditions
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Cookie Policy
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            About Us
          </a>
        </div>
        <p>&copy; {new Date().getFullYear()} Reading Buddy. All rights reserved.</p>
      </footer>
    </div>
  );
}
