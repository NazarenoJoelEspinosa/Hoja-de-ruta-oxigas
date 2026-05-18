import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HojaDeRutaTab from "@/components/hoja-de-ruta/HojaDeRutaTab";
import HistorialTab from "@/components/hoja-de-ruta/HistorialTab";
import ClientesTab from "@/components/hoja-de-ruta/ClientesTab";
import { useAuth } from "@/context/AuthContext";
import { LogOut } from "lucide-react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("hoja");
  const { nombre, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-primary uppercase">Hoja de Ruta</h1>
            <p className="text-sm text-muted-foreground">Distribución de Garrafas y Gases</p>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 sm:flex-none">
              <TabsList className="w-full sm:w-auto grid grid-cols-3">
                <TabsTrigger value="hoja">Ruta de Hoy</TabsTrigger>
                <TabsTrigger value="historial">Historial</TabsTrigger>
                <TabsTrigger value="clientes">Clientes</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
              <span className="hidden sm:inline font-medium text-foreground">{nombre}</span>
              <button
                onClick={logout}
                title="Cerrar sesión"
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="hoja" className="mt-0 outline-none">
            <HojaDeRutaTab />
          </TabsContent>
          <TabsContent value="historial" className="mt-0 outline-none">
            <HistorialTab />
          </TabsContent>
          <TabsContent value="clientes" className="mt-0 outline-none">
            <ClientesTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
