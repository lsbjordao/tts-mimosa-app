// ./src/app/page.tsx

"use client";

import { useEffect, useState } from "react";
import type { JSX } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  Search,
  Settings,
  Github,
  BookOpenText,
  FileText,
  ChartPie,
  Funnel,
  TestTube
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const JSONGrid = dynamic(() => import("@redheadphone/react-json-grid"), {
  ssr: false,
});

// ---------- Função auxiliar: extrai imagens (versão original que funcionava) ----------
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

// ---------- Função auxiliar: insere <wbr/> a cada 3 pontos ----------
function renderPathGrouped(path: string, groupSize = 3) {
  const parts = path.split(".");
  const groups: string[] = [];
  for (let i = 0; i < parts.length; i += groupSize) {
    groups.push(parts.slice(i, i + groupSize).join("."));
  }
  return groups.flatMap((g, i) =>
    i === groups.length - 1 ? [g] : [g, <wbr key={i} />]
  );
}

// ---------- Busca recursiva ----------
function searchInJSON(
  obj: any,
  term: string,
  options: { searchKeys: boolean; searchValues: boolean },
  path: string[] = []
): { path: string; value: string }[] {
  if (!term) return [];
  const results: { path: string; value: string }[] = [];

  if (typeof obj === "object" && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      if (options.searchKeys && key.toLowerCase().includes(term.toLowerCase())) {
        results.push({ path: [...path, key].join("."), value: "(key match)" });
      }

      if (
        options.searchValues &&
        typeof value === "string" &&
        value.toLowerCase().includes(term.toLowerCase())
      ) {
        results.push({ path: [...path, key].join("."), value });
      }

      results.push(...searchInJSON(value, term, options, [...path, key]));
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, i) =>
      results.push(...searchInJSON(item, term, options, [...path, `[${i}]`]))
    );
  }

  return results;
}

// ---------- Função de TESTE: analisa estrutura completa de uma planta ----------
function analyzePlantStructure(plant: any, plantName: string) {
  console.log(`🔍 ANALISANDO ESTRUTURA DA PLANTA: ${plantName}`);
  
  // Função recursiva para encontrar todas as propriedades
  function findAllProperties(obj: any, currentPath: string[] = []): { path: string; value: any; type: string }[] {
    const results: { path: string; value: any; type: string }[] = [];
    
    if (!obj || typeof obj !== 'object') return results;
    
    if (Array.isArray(obj)) {
      obj.forEach((item, i) => {
        results.push(...findAllProperties(item, [...currentPath, `[${i}]`]));
      });
    } else {
      // Adiciona informações sobre este objeto
      results.push({
        path: currentPath.join('.') || 'root',
        value: Object.keys(obj),
        type: 'object_keys'
      });
      
      // Verifica propriedades específicas de imagem
      const imageProps = ['imageUrl', 'url', 'src', 'photo', 'image', 'img'];
      imageProps.forEach(prop => {
        if (obj[prop] && typeof obj[prop] === 'string') {
          results.push({
            path: [...currentPath, prop].join('.'),
            value: obj[prop],
            type: 'image_url'
          });
        }
      });
      
      // Continua a busca recursiva
      for (const [key, value] of Object.entries(obj)) {
        if (value && typeof value === 'object') {
          results.push(...findAllProperties(value, [...currentPath, key]));
        }
      }
    }
    
    return results;
  }
  
  const allProps = findAllProperties(plant);
  
  // Filtra apenas propriedades relevantes
  const imageUrls = allProps.filter(p => p.type === 'image_url');
  const objectsWithKeys = allProps.filter(p => p.type === 'object_keys');
  
  console.log(`📊 RESUMO PARA ${plantName}:`);
  console.log(`   - Total de propriedades analisadas: ${allProps.length}`);
  console.log(`   - URLs de imagem encontradas: ${imageUrls.length}`);
  console.log(`   - Objetos com chaves: ${objectsWithKeys.length}`);
  
  if (imageUrls.length > 0) {
    console.log('   🖼️ URLs DE IMAGEM ENCONTRADAS:');
    imageUrls.forEach(img => {
      console.log(`     📍 ${img.path}: ${img.value}`);
    });
  } else {
    console.log('   ❌ NENHUMA URL DE IMAGEM ENCONTRADA');
  }
  
  // Mostra alguns objetos para debug
  console.log('   🏗️ ESTRUTURA DOS PRIMEIROS OBJETOS:');
  objectsWithKeys.slice(0, 5).forEach(obj => {
    console.log(`     📂 ${obj.path}: [${obj.value.join(', ')}]`);
  });
  
  return {
    imageUrls,
    objectsWithKeys,
    totalProps: allProps.length
  };
}

export default function Home() {
  const [plants, setPlants] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<
    { path: string; value: string; specificEpithet?: string }[]
  >([]);

  const [maxResults, setMaxResults] = useState(20);
  const [searchOptions, setSearchOptions] = useState({
    searchKeys: true,
    searchValues: true,
  });

  const [allImages, setAllImages] = useState<
    { path: string; url: string; legend?: string; specificEpithet?: string }[]
  >([]);

  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // ---------- Função de TESTE: analisa algumas plantas ----------
  const runImageExtractionTest = () => {
    console.clear();
    console.log("🧪 INICIANDO TESTE DE EXTRAÇÃO DE IMAGENS");
    setDebugInfo(prev => [...prev, "🧪 INICIANDO TESTE DE EXTRAÇÃO DE IMAGENS"]);
    
    if (plants.length === 0) {
      console.log("❌ Nenhuma planta carregada para teste");
      setDebugInfo(prev => [...prev, "❌ Nenhuma planta carregada para teste"]);
      return;
    }
    
    // Testa as primeiras 5 plantas
    const testPlants = plants.slice(0, 5);
    
    testPlants.forEach((plant, index) => {
      const plantName = plant.specificEpithet || `Planta ${index + 1}`;
      console.log(`\n--- TESTANDO ${plantName} ---`);
      setDebugInfo(prev => [...prev, `\n--- TESTANDO ${plantName} ---`]);
      
      // 1. Usa a função original de extração
      const extractedImages = extractImagesWithPaths(plant);
      console.log(`📸 Função extractImagesWithPaths encontrou: ${extractedImages.length} imagens`);
      setDebugInfo(prev => [...prev, `📸 Função extractImagesWithPaths encontrou: ${extractedImages.length} imagens`]);
      
      extractedImages.forEach(img => {
        console.log(`   ✅ ${img.path} → ${img.url}`);
        setDebugInfo(prev => [...prev, `   ✅ ${img.path} → ${img.url}`]);
      });
      
      // 2. Analisa a estrutura completa
      const analysis = analyzePlantStructure(plant, plantName);
      setDebugInfo(prev => [...prev, `   📊 URLs encontradas na análise: ${analysis.imageUrls.length}`]);
      
      if (extractedImages.length === 0 && analysis.imageUrls.length > 0) {
        console.log("   ⚠️  CONFLITO: Análise encontrou URLs mas extractImagesWithPaths não!");
        setDebugInfo(prev => [...prev, "   ⚠️  CONFLITO: Análise encontrou URLs mas extractImagesWithPaths não!"]);
      }
    });
    
    // Teste geral
    console.log("\n--- RESUMO GERAL ---");
    setDebugInfo(prev => [...prev, "\n--- RESUMO GERAL ---"]);
    
    const totalExtracted = plants.flatMap(p => extractImagesWithPaths(p)).length;
    console.log(`🖼️ Total de imagens extraídas de todas as plantas: ${totalExtracted}`);
    setDebugInfo(prev => [...prev, `🖼️ Total de imagens extraídas de todas as plantas: ${totalExtracted}`]);
    
    // Verifica se há imagens no allImages
    console.log(`📁 Imagens em allImages: ${allImages.length}`);
    setDebugInfo(prev => [...prev, `📁 Imagens em allImages: ${allImages.length}`]);
  };

  // ---------- Carrega dados ----------
  useEffect(() => {
    fetch("/TTS-Mimosa-App/data/MimosaDB.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("📦 Dados carregados:", data.length, "plantas");
        setPlants(data);

        // Extrai todas as imagens globais
        console.log("🖼️ Iniciando extração de imagens...");
        const all = data.flatMap((plant: any) => {
          const images = extractImagesWithPaths(plant);
          if (images.length > 0) {
            console.log(`✅ ${plant.specificEpithet}: ${images.length} imagens`);
          } else {
            console.log(`❌ ${plant.specificEpithet}: NENHUMA imagem`);
          }
          return images.map((img) => ({
            ...img,
            specificEpithet: plant.specificEpithet,
          }));
        });
        
        console.log("🎯 Total de imagens extraídas:", all.length);
        setAllImages(all);
        
        // Log detalhado das primeiras imagens
        if (all.length > 0) {
          console.log("📸 Primeiras 3 imagens encontradas:");
          all.slice(0, 3).forEach((img: any, i: any) => {
            console.log(`   ${i + 1}. ${img.specificEpithet} - ${img.path} → ${img.url}`);
          });
        } else {
          console.log("🚨 NENHUMA IMAGEM ENCONTRADA NO DATASET!");
        }
      })
      .catch((error) => {
        console.error("Error loading data:", error);
      });
  }, []);

  // ---------- Atualiza busca ----------
  useEffect(() => {
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }

    const results: { path: string; value: string; specificEpithet?: string }[] =
      [];
    for (const plant of plants) {
      const hits = searchInJSON(plant, searchTerm, searchOptions);
      hits.forEach((h) =>
        results.push({ ...h, specificEpithet: plant.specificEpithet })
      );
    }
    setSearchResults(results.slice(0, maxResults));
  }, [searchTerm, plants, maxResults, searchOptions]);

  const images: any = selected ? extractImagesWithPaths(selected) : allImages;

  // ---------- Controle do modal ----------
  const closeModal = () => setModalIndex(null);
  const showPrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setModalIndex((prev) => (prev! > 0 ? prev! - 1 : images.length - 1));
  };
  const showNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setModalIndex((prev) => (prev! < images.length - 1 ? prev! + 1 : 0));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length]);

  return (
    <div className="w-full h-screen bg-background text-foreground flex flex-col">
      {/* 🔍 Cabeçalho */}
      <header className="border-b border-border bg-card p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <b
            onClick={() => {
              setSelected(null);
              setModalIndex(null);
              setSearchTerm("");
              setSearchResults([]);
            }}
            className="cursor-pointer transition duration-300 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
            title="Reload home view"
          >
            TTS-Mimosa
          </b>
          <a
            href="https://doi.org/10.1093/biomethods/bpae017"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center"
            title="Foundational paper"
          >
            <FileText className="w-5 h-5 text-muted-foreground hover:text-primary transition" />
          </a>
          <a
            href="https://github.com/lsbjordao/TTS-Mimosa"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center"
            title="GitHub Repository"
          >
            <Github className="w-5 h-5 text-muted-foreground hover:text-primary transition" />
          </a>
          <a
            href="https://lsbjordao.github.io/TTS-Mimosa/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center"
            title="Docs"
          >
            <BookOpenText className="w-5 h-5 text-muted-foreground hover:text-primary transition" />
          </a>

          <Link
            href="/analytics"
            rel="noopener noreferrer"
            className="flex items-center"
            title="Analytics"
          >
            <ChartPie className="w-5 h-5 text-muted-foreground hover:text-primary transition" />
          </Link>

          <Link
            href="/filter"
            rel="noopener noreferrer"
            className="flex items-center"
            title="Filter"
          >
            <Funnel className="w-5 h-5 text-muted-foreground hover:text-primary transition" />
          </Link>

          {/* Botão de TESTE */}
          <Button
            variant="outline"
            size="sm"
            onClick={runImageExtractionTest}
            className="flex items-center gap-1"
            title="Run image extraction test"
          >
            <TestTube className="w-4 h-4" />
            Test Images
          </Button>

          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search within the entire JSON..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />

          <Popover>
            <PopoverTrigger asChild>
              <button
                className="p-2 rounded-md hover:bg-muted transition"
                title="Search settings"
              >
                <Settings className="w-5 h-5 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64">
              <div className="flex flex-col gap-3">
                <h4 className="font-medium text-sm mb-1">Search settings</h4>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Result limit:</label>
                  <select
                    aria-label="Limite de resultados"
                    value={maxResults}
                    onChange={(e) => setMaxResults(Number(e.target.value))}
                    className="border rounded-md p-1 bg-background text-foreground"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20 (default)</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={500}>500</option>
                    <option value={1000}>Max</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-xs text-muted-foreground">Search in:</label>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={searchOptions.searchKeys}
                      onChange={(e) =>
                        setSearchOptions((prev) => ({
                          ...prev,
                          searchKeys: e.target.checked,
                        }))
                      }
                    />
                    Keys
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={searchOptions.searchValues}
                      onChange={(e) =>
                        setSearchOptions((prev) => ({
                          ...prev,
                          searchValues: e.target.checked,
                        }))
                      }
                    />
                    Values
                  </label>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Resultados da busca */}
        {searchResults.length > 0 && (
          <div className="border border-border rounded-md bg-background mt-1 max-h-48 overflow-auto">
            {searchResults.map((r, i) => (
              <button
                key={i}
                onClick={() => {
                  const match = plants.find(
                    (p) => p.specificEpithet === r.specificEpithet
                  );
                  setSelected(match || null);
                  setSearchTerm("");
                  setSearchResults([]);
                }}
                className="w-full text-left px-2 py-1 hover:bg-muted border-b border-border last:border-none flex justify-between items-center"
              >
                <div>
                  <p className="text-sm font-mono wrap-break-word text-primary">
                    {r.path}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.value}
                  </p>
                </div>
                <span className="text-xs font-semibold text-right text-foreground ml-2">
                  {"Mimosa " + r.specificEpithet}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Painel de DEBUG */}
        {debugMode && debugInfo.length > 0 && (
          <div className="border border-yellow-500 rounded-md bg-yellow-50 mt-1 max-h-48 overflow-auto p-2">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-sm text-yellow-800">Debug Info</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDebugInfo([])}
                className="h-6 text-xs"
              >
                Clear
              </Button>
            </div>
            {debugInfo.map((info, i) => (
              <pre key={i} className="text-xs text-yellow-700 whitespace-pre-wrap">
                {info}
              </pre>
            ))}
          </div>
        )}
      </header>

      {/* 🧩 Corpo principal */}
      <div className="grid grid-cols-[250px_1fr_300px] flex-1 w-full overflow-hidden">
        {/* Sidebar esquerda */}
        <ScrollArea className="border-r border-border p-3 h-full overflow-auto dark-scrollbar">
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle>Taxon ({plants.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {plants.map((p, i) => (
                <button
                  key={i}
                  className={`w-full text-left px-2 py-1 rounded hover:bg-muted ${
                    selected?.specificEpithet === p.specificEpithet
                      ? "bg-muted"
                      : ""
                  }`}
                  onClick={() => setSelected(p)}
                >
                  <i>Mimosa {p.specificEpithet || "sp."}</i>
                </button>
              ))}
            </CardContent>
          </Card>
        </ScrollArea>

        {/* Painel central */}
        <main className="p-3 h-full overflow-auto dark-scrollbar bg-background relative">
          {selected ? (
            <Card className="bg-card text-card-foreground min-w-full">
              <CardHeader>
                <CardTitle>
                  <i>Mimosa {selected.specificEpithet}</i>
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-auto dark-scrollbar max-h-[calc(100vh-185px)]">
                <div className="inline-block min-w-max">
                  <JSONGrid data={selected} defaultExpandDepth={Infinity} />
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="text-muted-foreground text-center">
                Select a taxon on left
              </p>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Image
                  src="/TTS-Mimosa-App/tts.png"
                  alt="TypeTaxonScript Logo"
                  width={80}
                  height={80}
                  className="w-auto h-20 opacity-30"
                  priority
                />
              </div>
            </>
          )}
        </main>

        {/* Painel direito */}
        <ScrollArea className="border-l border-border p-3 h-full overflow-auto dark-scrollbar">
          <Card className="bg-card text-card-foreground w-full max-w-full box-border">
            <CardHeader>
              <CardTitle>Images ({images.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {images.length > 0 ? (
                images.map((img: any, idx: any) => (
                  <div key={idx} className="space-y-2 p-2 border rounded-lg bg-muted/10">
                    {!selected && img.specificEpithet && (
                      <p className="text-xs text-primary text-center font-medium">
                        <i>Mimosa {img.specificEpithet}</i>
                      </p>
                    )}
                    <p
                      className="text-xs text-muted-foreground font-mono whitespace-normal wrap-break-word bg-muted p-1 rounded"
                      title={img.path}
                    >
                      {renderPathGrouped(img.path, 3)}
                    </p>
                    <div
                      className="bg-muted rounded overflow-hidden cursor-pointer flex justify-center hover:opacity-90 transition-opacity min-h-[150px] items-center"
                      onClick={() => setModalIndex(idx)}
                    >
                      <Image
                        src={img.url}
                        alt={img.legend || `Image ${idx + 1}`}
                        width={280}
                        height={200}
                        className="h-auto max-h-48 object-contain"
                        loading="eager"
                        priority={idx < 3}
                        onError={(e) => {
                          console.error("❌ Erro ao carregar imagem:", img.url);
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-32 flex items-center justify-center bg-red-50 border border-red-200 rounded">
                                <span class="text-red-500 text-sm">Failed to load: ${img.url}</span>
                              </div>
                            `;
                          }
                        }}
                        onLoad={() => console.log("✅ Imagem carregada:", img.url)}
                      />
                    </div>
                    {img.legend && (
                      <p className="text-xs text-muted-foreground italic text-center">
                        {img.legend}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center p-4">
                  <p className="text-muted-foreground">No images found.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {plants.length > 0 ? "Select a taxon to see images" : "Loading data..."}
                  </p>
                  {allImages.length === 0 && plants.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={runImageExtractionTest}
                      className="mt-2"
                    >
                      Debug Image Extraction
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </ScrollArea>
      </div>

      {/* 🖼️ Modal de imagem */}
      {modalIndex !== null && images[modalIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center"
          onClick={closeModal}
        >
          <button
            onClick={closeModal}
            className="absolute top-4 right-6 text-white text-3xl font-light hover:text-primary transition z-10"
          >
            ×
          </button>

          <button
            onClick={showPrev}
            className="absolute left-4 text-white text-5xl font-light hover:text-primary transition select-none z-10"
          >
            ‹
          </button>

          <div className="max-w-[90vw] max-h-[80vh] flex flex-col items-center">
            <Image
              src={images[modalIndex].url}
              alt={images[modalIndex].legend || `Image ${modalIndex + 1}`}
              width={1200}
              height={900}
              className="object-contain max-h-[80vh]"
              loading="eager"
              priority
              onError={(e) => {
                console.error("❌ Erro no modal:", images[modalIndex].url);
                const target = e.currentTarget;
                target.style.display = 'none';
                const container = target.parentElement;
                if (container) {
                  container.innerHTML = `
                    <div class="w-64 h-64 flex items-center justify-center bg-red-100 border-2 border-red-300 rounded">
                      <span class="text-red-600 font-medium">Failed: ${images[modalIndex].url}</span>
                    </div>
                  `;
                }
              }}
            />
            {images[modalIndex].legend && (
              <p className="text-sm text-muted-foreground italic mt-2 text-center">
                {images[modalIndex].legend}
              </p>
            )}
            {images[modalIndex].specificEpithet && !selected && (
              <p className="text-sm text-white italic mt-1">
                Mimosa {images[modalIndex].specificEpithet}
              </p>
            )}
          </div>

          <button
            onClick={showNext}
            className="absolute right-4 text-white text-5xl font-light hover:text-primary transition select-none z-10"
          >
            ›
          </button>

          <div className="absolute bottom-4 text-white text-sm">
            {modalIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}