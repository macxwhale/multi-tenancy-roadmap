import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Users, FileText, Package, Loader2 } from 'lucide-react';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { Badge } from '@/components/ui/badge';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeIcons = {
  client: Users,
  invoice: FileText,
  product: Package,
};

const typeLabels = {
  client: 'Clients',
  invoice: 'Invoices',
  product: 'Products',
};

const typeBadgeVariants = {
  client: 'default' as const,
  invoice: 'secondary' as const,
  product: 'outline' as const,
};

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const { results, loading } = useGlobalSearch(query);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const handleSelect = (path: string) => {
    onOpenChange(false);
    navigate(path);
    setQuery('');
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, typeof results>);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search clients, invoices, products..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {!loading && query.length < 2 && (
          <CommandEmpty>Type at least 2 characters to search</CommandEmpty>
        )}
        
        {!loading && query.length >= 2 && results.length === 0 && (
          <CommandEmpty>No results found</CommandEmpty>
        )}

        {!loading && Object.entries(groupedResults).map(([type, items], index) => {
          const Icon = typeIcons[type as keyof typeof typeIcons];
          const label = typeLabels[type as keyof typeof typeLabels];
          
          return (
            <div key={type}>
              {index > 0 && <CommandSeparator />}
              <CommandGroup heading={label}>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${type}-${item.id}-${item.title}-${item.subtitle || ''}`}
                    onSelect={() => handleSelect(item.path)}
                    className="flex items-center gap-3 py-3"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{item.title}</span>
                        <Badge
                          variant={typeBadgeVariants[item.type]}
                          className="text-xs"
                        >
                          {type}
                        </Badge>
                      </div>
                      {item.subtitle && (
                        <p className="text-sm text-muted-foreground truncate">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
