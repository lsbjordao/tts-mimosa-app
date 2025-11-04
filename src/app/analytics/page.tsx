// ./src/app/analytics/page.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import Header from "./header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#6366f1", "#22d3ee", "#10b981", "#f59e0b", "#ef4444"];

export default function Analytics() {
  const [plants, setPlants] = useState<any[]>([]);

  useEffect(() => {
    fetch("/TTS-Mimosa-App/data/MimosaDB.json")
      .then((res) => res.json())
      .then((data) => setPlants(data));
  }, []);

  // sumarização: número de campos por espécie
  const summary = useMemo(() => {
    if (!plants.length) return [];
    return plants.map((p) => ({
      name: p.specificEpithet || "sp.",
      keys: Object.keys(p).length,
    }));
  }, [plants]);

  // sumarização: contagem de chaves mais frequentes no dataset
  const keyFreq = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of plants) {
      Object.keys(p).forEach((k) => (counts[k] = (counts[k] || 0) + 1));
    }
    return Object.entries(counts)
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [plants]);

  return (
    <div className="w-full h-screen bg-background text-foreground flex flex-col">
      <Header />

      <ScrollArea className="flex-1 p-4">
        <Tabs defaultValue="structure" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="structure">Campos por Táxon</TabsTrigger>
            <TabsTrigger value="keys">Chaves Frequentes</TabsTrigger>
          </TabsList>

          {/* Gráfico de barras - nº de chaves por táxon */}
          <TabsContent value="structure">
            <Card>
              <CardHeader>
                <CardTitle>Número de campos por espécie</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="keys" radius={[6, 6, 0, 0]}>
                      {summary.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gráfico de pizza - chaves mais comuns */}
          <TabsContent value="keys">
            <Card>
              <CardHeader>
                <CardTitle>Chaves mais frequentes no JSON</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px] flex justify-center items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={keyFreq}
                      dataKey="count"
                      nameKey="key"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label
                    >
                      {keyFreq.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  );
}
