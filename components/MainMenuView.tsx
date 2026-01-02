
import React from 'react';
import { 
  Home, Sprout, Leaf, TreePine, Scissors, TrendingUp, Pickaxe, 
  Bug, Target, Warehouse, Fuel, Package, Calculator, BarChart3, 
  Settings, Database, DollarSign, ChevronRight, LayoutGrid
} from 'lucide-react';

interface MenuOption {
  id: string;
  label: string;
  icon: any;
  color: string;
  category: string;
}

interface MainMenuViewProps {
  onSelectTab: (id: string) => void;
}

export const MainMenuView: React.FC<MainMenuViewProps> = ({ onSelectTab }) => {
  const menuOptions: MenuOption[] = [
    { id: 'inventory', label: 'Inicio / Bodega', icon: Home, color: 'bg-emerald-500', category: 'General' },
    { id: 'lots', label: 'Gestión de Lotes', icon: LayoutGrid, color: 'bg-emerald-700', category: 'Estructura' },
    { id: 'scheduler', label: 'Germinador y Semilleros', icon: Sprout, color: 'bg-green-600', category: 'Etapas' },
    { id: 'assets', label: 'Almácigo y Vivero', icon: Leaf, color: 'bg-emerald-400', category: 'Etapas' },
    { id: 'lots', label: 'Renovación y Siembra', icon: Scissors, color: 'bg-amber-700', category: 'Mantenimiento' },
    { id: 'labor', label: 'Lotes en Levante (0-12m)', icon: TrendingUp, color: 'bg-blue-500', category: 'Producción' },
    { id: 'scheduler', label: 'Fertilización en Producción', icon: Pickaxe, color: 'bg-indigo-600', category: 'Nutrición' },
    { id: 'management', label: 'Control de Broca y Plagas', icon: Bug, color: 'bg-red-600', category: 'Sanidad' },
    { id: 'harvest', label: 'Recolección y Cosecha', icon: Target, color: 'bg-emerald-600', category: 'Producción' },
    { id: 'inventory', label: 'Beneficio de Café', icon: Warehouse, color: 'bg-slate-600', category: 'Pos-Cosecha' },
    { id: 'management', label: 'Combustibles y Secado', icon: Fuel, color: 'bg-orange-600', category: 'Operación' },
    { id: 'simulator', label: 'Simulador de Rentabilidad', icon: Calculator, color: 'bg-purple-600', category: 'Inteligencia' },
  ];

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {menuOptions.map((opt, idx) => (
            <button 
              key={idx}
              onClick={() => onSelectTab(opt.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all active:scale-98 group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full ${opt.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                  <opt.icon className="w-7 h-7" />
                </div>
                <div className="text-left">
                  <p className="text-slate-800 dark:text-white font-black text-sm uppercase tracking-tight">{opt.label}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{opt.category}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      <div className="bg-indigo-900/10 p-6 rounded-[2.5rem] border border-indigo-500/20 text-center">
        <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em]">Desarrollado por Lucas Mateo Tabares Franco</p>
        <p className="text-[8px] text-slate-500 uppercase mt-1 italic">Software de Inteligencia Agrícola 360 • Colombia 2025</p>
      </div>
    </div>
  );
};
