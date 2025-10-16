import { useState } from "react";
import { LayoutDashboard, Users, FileText, Package, ChevronRight, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const menuGroups = [
  {
    label: "Dashboards",
    items: [
      { title: "Default", url: "/", icon: LayoutDashboard },
    ]
  },
  {
    label: "Management",
    items: [
      { title: "Customers", url: "/clients", icon: Users },
      { title: "Invoices", url: "/invoices", icon: FileText },
      { title: "Products", url: "/products", icon: Package },
    ]
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const [openGroups, setOpenGroups] = useState<string[]>(["Dashboards"]);

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => 
      prev.includes(label) 
        ? prev.filter(g => g !== label)
        : [...prev, label]
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0 bg-sidebar-background">
      <div className="p-6 border-b border-sidebar-border/30">
        {state === "expanded" && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-sidebar-foreground tracking-tight">Dashbrd</h1>
          </div>
        )}
      </div>

      <SidebarContent className="px-3 py-6">
        {menuGroups.map((group) => (
          <Collapsible
            key={group.label}
            open={openGroups.includes(group.label)}
            onOpenChange={() => toggleGroup(group.label)}
            className="mb-4"
          >
            <SidebarGroup>
              <CollapsibleTrigger className="w-full group/collapsible">
                <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider px-3 mb-2 flex items-center justify-between hover:text-sidebar-foreground/80 transition-colors cursor-pointer">
                  <span>{state === "expanded" ? group.label : ""}</span>
                  {state === "expanded" && (
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      openGroups.includes(group.label) && "rotate-90"
                    )} />
                  )}
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end
                            className={({ isActive }) =>
                              cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                isActive
                                  ? "bg-sidebar-accent text-sidebar-foreground"
                                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                              )
                            }
                          >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            {state === "expanded" && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <div className="mt-auto p-3 border-t border-sidebar-border/30">
        <SidebarMenuButton asChild>
          <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-200">
            <Settings className="h-4 w-4" />
            {state === "expanded" && <span>Settings</span>}
          </button>
        </SidebarMenuButton>
      </div>
    </Sidebar>
  );
}
