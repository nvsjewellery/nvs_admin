import { Bell, Menu, Search, ChevronDown, LogOut } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { useAdmin } from "@/lib/admin-store";

export function AdminTopbar({ onToggle }: { onToggle: () => void }) {
  const { adminUser, logoutAdmin } = useAdmin();
  const nav = useNavigate();

  async function handleLogout() {
    await logoutAdmin();
    nav({ to: "/login" });
  }

  const initials = adminUser?.email ? adminUser.email.slice(0, 2).toUpperCase() : "AD";

  return (
    <header className="h-16 shrink-0 bg-card border-b flex items-center gap-3 px-4 md:px-6">
      <Button variant="ghost" size="icon" onClick={onToggle} className="shrink-0">
        <Menu className="h-5 w-5" />
      </Button>

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products, orders, customers…"
          className="pl-9 bg-muted/50 border-transparent focus-visible:bg-background"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-gold" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="p-3 border-b font-medium text-sm">Notifications</div>
            <div className="divide-y max-h-80 overflow-auto text-sm">
              {[
                { t: "New order NVS-10239", d: "Priya Iyer • ₹1,52,300", when: "2m ago" },
                { t: "Low stock: Kiaan Kada Bangle", d: "2 pieces remaining", when: "1h ago" },
                { t: "Gold rate updated", d: "22K ₹10,120 → ₹10,190", when: "5h ago" },
                { t: "Review flagged", d: "Ishani 14K Chain • 2★", when: "Yesterday" },
              ].map((n, i) => (
                <div key={i} className="p-3 hover:bg-muted/50 cursor-pointer">
                  <div className="font-medium">{n.t}</div>
                  <div className="text-xs text-muted-foreground">{n.d}</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">{n.when}</div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted transition">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gold text-gold-foreground text-xs font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left leading-tight">
                <div className="text-sm font-medium">{adminUser?.email ?? "Admin"}</div>
                <Badge variant="outline" className="h-4 text-[10px] px-1 border-gold text-gold-foreground bg-gold/15">
                  Admin
                </Badge>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}