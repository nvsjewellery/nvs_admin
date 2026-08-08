import { Menu, ChevronDown, LogOut } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAdmin } from "@/lib/admin-store";

export function AdminTopbar({ onToggle }: { onToggle: () => void }) {
  const { adminUser, logoutAdmin } = useAdmin();
  const nav = useNavigate();

  async function handleLogout() {
    await logoutAdmin();
    nav({ to: "/login" });
  }

  const initials = adminUser?.email
    ? adminUser.email.slice(0, 2).toUpperCase()
    : "AD";

  return (
    <header className="h-16 border-b bg-background flex items-center px-4">
      {/* Sidebar Toggle */}
      <button
        type="button"
        onClick={onToggle}
        className="h-9 w-9 rounded-md flex items-center justify-center hover:bg-muted transition"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Right Side - Profile */}
      <div className="ml-auto flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted transition"
              aria-label="Admin account menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gold text-gold-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              {adminUser?.email ?? "Admin"}
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}