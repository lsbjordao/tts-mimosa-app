"use client";

import { useEffect, useState } from "react";
import Header from "./header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, ChevronsUpDown, Check } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Filter {
  path: string;
  value: string;
}

export default function FilterPage() {
  const [plants, setPlants] = useState<any[]>([]);
  const [stringPaths, setStringPaths] = useState<
    { path: string; options: string[] }[]
  >([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [filteredPlants, setFilteredPlants] = useState<any[]>([]);
  const [allImages, setAllImages] = useState<
    { path: string; url: string; legend?: string; specificEpithet?: string }[]
  >([]);

  // ---------- Função: obtém valor via path ----------
  function getByPath(obj: any, path: string) {
    return path
      .split(".")
      .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
  }

  // ---------- Função: coleta caminhos de strings ----------
  function extractStringPaths(data: any[]) {
    const paths: Record<string, Set<string>> = {};

    function recurse(obj: any, prefix = "") {
      if (Array.isArray(obj)) {
        obj.forEach((v) => recurse(v, prefix));
      } else if (obj && typeof obj === "object") {
        for (const [key, value] of Object.entries(obj)) {
          const newPath = prefix ? `${prefix}.${key}` : key;
          if (typeof value === "string" && value.trim() !== "") {
            if (!paths[newPath]) paths[newPath] = new Set();
            paths[newPath].add(value);
          } else {
            recurse(value, newPath);
          }
        }
      }
    }

    data.forEach((item) => recurse(item));
    return Object.entries(paths)
      .map(([path, set]) => ({
        path,
        options: Array.from(set).sort(),
      }))
      .sort((a, b) => a.path.localeCompare(b.path));
  }

  // ---------- Função: extrai imagens ----------
  function extractImagesWithPaths(obj: any, path: string[] = []) {
    let results: { path: string; url: string; legend?: string }[] = [];
    if (Array.isArray(obj)) {
      obj.forEach((item, i) =>
        results.push(...extractImagesWithPaths(item, [...path, `[${i}]`]))
      );
    } else if (typeof obj === "object" && obj !== null) {
      let url, legend;
      for (const [key, value] of Object.entries(obj)) {
        if (key === "imageUrl") url = value as string;
        else if (key === "imageUrlLegend") legend = value as string;
        else results.push(...extractImagesWithPaths(value, [...path, key]));
      }
      if (url) results.push({ path: path.join(".") || "root", url, legend });
    }
    return results;
  }

  // ---------- Carrega dados ----------
  useEffect(() => {
    fetch("/TTS-Mimosa-App/data/MimosaDB.json")
      .then((res) => res.json())
      .then((data) => {
        setPlants(data);
        setStringPaths(extractStringPaths(data));

        const all = data.flatMap((plant: any) =>
          extractImagesWithPaths(plant).map((img) => ({
            ...img,
            specificEpithet: plant.specificEpithet,
          }))
        );
        setAllImages(all);
        setFilteredPlants(data);
      });
  }, []);

  // ---------- Aplica filtros ----------
  useEffect(() => {
    if (filters.length === 0) {
      setFilteredPlants(plants);
      return;
    }
    const filtered = plants.filter((p) =>
      filters.every((f) => getByPath(p, f.path) === f.value)
    );
    setFilteredPlants(filtered);
  }, [filters, plants]);

  // ---------- Adiciona filtro ----------
  const addFilter = () => {
    setFilters([...filters, { path: "", value: "" }]);
  };

  // ---------- Remove filtro ----------
  const removeFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    setFilters(newFilters);
  };

  // ---------- Atualiza filtro ----------
  const updateFilter = (index: number, field: "path" | "value", value: string) => {
    const newFilters = [...filters];
    newFilters[index][field] = value;
    if (field === "path") newFilters[index].value = "";
    setFilters(newFilters);
  };

  // ---------- Renderização ----------
  return (
    <div className="w-full h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <Header />
      </div>

      <div className="grid grid-cols-[300px_1fr_300px] flex-1 min-h-0">
        {/* Coluna esquerda */}
        <ScrollArea className="border-r border-border flex-1 overflow-auto p-4 dark-scrollbar">
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle>Taxa ({filteredPlants.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {filteredPlants.map((p, i) => (
                <p key={i} className="text-sm italic">
                  Mimosa {p.specificEpithet || "sp."}
                </p>
              ))}
            </CardContent>
          </Card>
        </ScrollArea>

        {/* Coluna central */}
        <main className="p-6 overflow-auto dark-scrollbar space-y-4">
          <h2 className="text-lg font-semibold">Filtering</h2>

          <div className="space-y-3">
            {filters.map((f, i) => {
              const selectedPath = stringPaths.find((sp) => sp.path === f.path);
              const valueOptions = selectedPath?.options || [];

              const [open, setOpen] = useState(false);

              return (
                <div key={i} className="flex items-center gap-2">
                  {/* Combobox pesquisável */}
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                      >
                        {f.path ? f.path : "Select field..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0 max-h-[300px] overflow-auto">
                      <Command>
                        <CommandInput placeholder="Search field..." />
                        <CommandList>
                          <CommandEmpty>No results found.</CommandEmpty>
                          <CommandGroup>
                            {stringPaths.map((sp) => (
                              <CommandItem
                                key={sp.path}
                                onSelect={() => {
                                  updateFilter(i, "path", sp.path);
                                  setOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    f.path === sp.path ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {sp.path}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {/* Select de valores */}
                  <Select
                    onValueChange={(value) => updateFilter(i, "value", value)}
                    value={f.value}
                    disabled={!f.path}
                  >
                    <SelectTrigger className="w-full flex-1">
                      <SelectValue placeholder="Select value..." />
                    </SelectTrigger>
                    <SelectContent>
                      {valueOptions.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFilter(i)}
                    title="Remove filter"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>

          <Button
            variant="outline"
            onClick={addFilter}
            className="flex items-center gap-1 mt-2"
          >
            <Plus className="w-4 h-4" /> Add filter
          </Button>

          <p className="text-sm text-muted-foreground mt-4">
            {filters.length
              ? `Showing ${filteredPlants.length} taxa matching selected filters.`
              : "Add filters to narrow down taxa."}
          </p>
        </main>

        {/* Coluna direita */}
        <ScrollArea className="border-l border-border flex-1 overflow-auto p-4 dark-scrollbar">
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredPlants.length === 0 ? (
                <p className="text-muted-foreground text-sm">No matches.</p>
              ) : (
                filteredPlants.flatMap((p, idx) => {
                  const imgs = extractImagesWithPaths(p);
                  return imgs.length > 0 ? (
                    <div key={idx}>
                      <p className="text-sm text-primary italic text-center mb-1">
                        Mimosa {p.specificEpithet}
                      </p>
                      {imgs.map((img, j) => (
                        <div key={j} className="mb-2">
                          <Image
                            src={img.url}
                            alt={img.legend || ""}
                            width={300}
                            height={200}
                            className="rounded-md border border-border"
                          />
                          {img.legend && (
                            <p className="text-xs text-muted-foreground italic text-center mt-1">
                              {img.legend}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null;
                })
              )}
            </CardContent>
          </Card>
        </ScrollArea>
      </div>
    </div>
  );
}
