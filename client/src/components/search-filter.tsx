import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SearchFilterProps {
  onSearchChange?: (value: string) => void;
  onFilterChange?: (value: string) => void;
}

export default function SearchFilter({ onSearchChange, onFilterChange }: SearchFilterProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearchChange?.(value);
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
    onFilterChange?.(value);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6" data-testid="search-filter">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">
          Cryptocurrency Markets
        </h1>
        
        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search pairs..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 w-full sm:w-64"
              data-testid="search-input"
            />
          </div>
          
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-32" data-testid="filter-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pairs</SelectItem>
              <SelectItem value="usd">USD Pairs</SelectItem>
              <SelectItem value="eur">EUR Pairs</SelectItem>
              <SelectItem value="btc">BTC Pairs</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
