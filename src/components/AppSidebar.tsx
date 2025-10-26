import { useState } from "react";
import { LayoutDashboard, Users, FileText, Package, ChevronRight, Settings, Plus } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ClientDialog } from "@/components/clients/ClientDialog";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
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
    label: "Client & Sales",
    items: [
      { title: "Client List", url: "/clients", icon: Users },
      { title: "Invoices", url: "/invoices", icon: FileText },
      { title: "Products", url: "/products", icon: Package },
    ]
  }
];

export function AppSidebar() {
  const { state, setOpen } = useSidebar();
  const isMobile = useIsMobile();
  const [openGroups, setOpenGroups] = useState<string[]>(["Dashboards"]);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);

  const handleMobileMenuClick = () => {
    if (isMobile) {
      setOpen(false);
    }
  };

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => 
      prev.includes(label) 
        ? prev.filter(g => g !== label)
        : [...prev, label]
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0 bg-sidebar-background">
      <div className={cn("p-6 border-b border-sidebar-border/30", state === "collapsed" && "flex justify-center")}>
        {state === "expanded" ? (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-lg">
              <LayoutDashboard className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent tracking-tight">Dashboard</h1>
          </div>
        ) : (
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-lg">
            <LayoutDashboard className="h-7 w-7 text-white" />
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
                    {group.label === "Client & Sales" && (
                        <SidebarMenuItem>
                        <button
                          onClick={() => {
                            setClientDialogOpen(true);
                            handleMobileMenuClick();
                          }}
                          className={cn(
                            "flex items-center gap-4 rounded-xl px-4 py-4 text-base font-semibold transition-all duration-200 bg-gradient-to-r from-primary/20 to-secondary/20 hover:from-primary/30 hover:to-secondary/30 text-sidebar-foreground w-full shadow-sm hover:shadow-md hover:scale-105",
                            state === "collapsed" && "justify-center"
                          )}
                        >
                          <Plus className="h-6 w-6 flex-shrink-0 text-primary" />
                          {state === "expanded" && <span>Add Client</span>}
                        </button>
                      </SidebarMenuItem>
                    )}
                    {group.items.map((item, index) => {
                      const colors = [
                        "from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30",
                        "from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30",
                        "from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30",
                      ];
                      const iconColors = ["text-red-500", "text-blue-500", "text-purple-500"];
                      
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              end
                              onClick={handleMobileMenuClick}
                              className={({ isActive }) =>
                                cn(
                                  "flex items-center gap-4 rounded-xl px-4 py-4 text-base font-semibold transition-all duration-200 shadow-sm",
                                  isActive
                                    ? `bg-gradient-to-r ${colors[index % colors.length]} scale-105 shadow-md`
                                    : `hover:bg-gradient-to-r ${colors[index % colors.length]} hover:scale-105`,
                                  state === "collapsed" && "justify-center"
                                )
                              }
                            >
                              <item.icon className={cn("h-6 w-6 flex-shrink-0", iconColors[index % iconColors.length])} />
                              {state === "expanded" && <span>{item.title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <div className="mt-auto p-3 border-t border-sidebar-border/30">
        <SidebarMenuButton asChild>
          <button 
            onClick={handleMobileMenuClick}
            className={cn(
            "w-full flex items-center gap-4 rounded-xl px-4 py-4 text-base font-semibold bg-gradient-to-r from-green-500/20 to-teal-500/20 hover:from-green-500/30 hover:to-teal-500/30 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105",
            state === "collapsed" && "justify-center"
          )}>
            <Settings className="h-6 w-6 text-green-500" />
            {state === "expanded" && <span>Settings</span>}
          </button>
        </SidebarMenuButton>
      </div>

      <ClientDialog
        open={clientDialogOpen}
        onClose={() => setClientDialogOpen(false)}
        client={null}
      />
    </Sidebar>
  );
}
