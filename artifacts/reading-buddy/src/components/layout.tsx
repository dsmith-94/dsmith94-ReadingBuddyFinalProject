import { Link, useLocation } from "wouter";
import { BookOpen, Target, Settings, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { path: "/app", label: "Log Reading", icon: Home },
    { path: "/app/my-books", label: "My Books", icon: BookOpen },
    { path: "/app/goals", label: "Reading Goals", icon: Target },
    { path: "/app/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="pt-8 pb-4 px-4 sm:px-8 flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-serif text-primary font-bold tracking-tight">Reading Buddy</h1>
          <p className="text-muted-foreground text-sm mt-1 italic font-serif">Your personal reading journal</p>
        </div>
        
        <nav className="flex items-center space-x-1 sm:space-x-2 bg-card p-1.5 rounded-full shadow-sm border border-card-border overflow-x-auto max-w-full">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ease-in-out whitespace-nowrap",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-foreground hover:bg-muted"
                )}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8">
        {children}
      </main>

      <footer className="py-8 text-center text-xs text-muted-foreground">
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-2">
          <a href="#" className="hover:text-primary transition-colors">Terms & Conditions</a>
          <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition-colors">Cookie Policy</a>
          <a href="#" className="hover:text-primary transition-colors">About Us</a>
        </div>
        <p>&copy; {new Date().getFullYear()} Reading Buddy. All rights reserved.</p>
      </footer>
    </div>
  );
}
