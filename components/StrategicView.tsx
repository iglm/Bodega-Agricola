
import React, { useMemo, useState, useEffect } from 'react';
import { AppState, SWOT, CostCenter, Activity } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { InvestmentCalculatorView } from './InvestmentCalculatorView';
import { Target, TrendingUp, DollarSign, PieChart, Landmark, Timer, ArrowRightLeft, Lightbulb, ShieldCheck, Briefcase, Activity as ActivityIcon, Info, Users, AlertTriangle, Scale, Database, BarChart3, Search, Zap, CheckCircle, BrainCircuit, Sprout, Split, BookOpen, ArrowDown, ArrowUp } from 'lucide-react';

interface StrategicViewProps {
  data: AppState;
  onUpdateSWOT: (swot: SWOT) => void;
}

// Datos de referencia extraídos del Informe Ejecutivo (Promedios Técnicos Caldas/Eje Cafetero)
const CALDAS_BENCHMARKS = [
  { crop: 'Café', laborPart: 0.68, yield: 2800 }, 
  { crop: 'Plátano', laborPart: 0.576, yield: 14000 },
  { crop: 'Aguacate', laborPart: 0.441, yield: 12000 },
  { crop: 'Banano', laborPart: 0.76, yield: 31790 },
];

const KPI_Card: React.FC<{title: string, value: string, subvalue?: string, color: string, icon: React.ElementType}> = ({title, value, subvalue, color, icon: Icon}) => (
    <div className={`bg-slate-950/50 p-6 rounded-3xl border border-slate-800`}>
        <p className={`text-[10px] font-black uppercase mb-3 flex items-center gap-2 ${color}`}>
            <Icon className="w-4 h-4" /> {title}
        </p>
        <p className="text-2xl font-black text-white font-mono">{value}</p>
        {subvalue && <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{subvalue}</p>}
    </div>
);

const PieChartSVG: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
    const total = data.reduce((acc, d) => acc + d.value, 0);
    if (total === 0) return <div className="h-24 flex items-center justify-center text-slate-500 text-xs">Sin datos para graficar</div>;
    
    let cumulative = 0;
    const segments = data.map(d => {
        const percentage = d.value / total;
        const startAngle = (cumulative / total) * 360;
        cumulative += d.value;
        const endAngle = (cumulative / total) * 360;
        
        const largeArcFlag = percentage > 0.5 ? 1 : 0;
        const x1 = 50 + 40 * Math.cos(Math.PI * startAngle / 180);
        const y1 = 50 + 40 * Math.sin(Math.PI * startAngle / 180);
        const x2 = 50 + 40 * Math.cos(Math.PI * endAngle / 180);
        const y2 = 50 + 40 * Math.sin(Math.PI * endAngle / 180);
        
        return <path key={d.label} d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`} fill={d.color} />;
    });

    return (
        <div className="flex flex-col md:flex-row items-center gap-4">
            <svg viewBox="0 0 100 100" className="w-24 h-24">{segments}</svg>
            <div className="space-y-2">
                {data.map(d => (
                    <div key={d.label} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-xs text-slate-300 font-bold">{d.label}: <span className="font-mono">{((d.value / total) * 100).toFixed(1)}%</span></span>
                    </div>
                ))}
            </div>
        </div>
    );
};


export const StrategicView: React.FC<StrategicViewProps> = ({ data, onUpdateSWOT }) => {
  const [arriendoFigurado, setArriendoFigurado] = useState('500000');
  const [swot, setSwot] = useState<SWOT>(data.swot || { f: '', o: '', d: '', a: '' });

  const laborFactor = data.laborFactor || 1.0;

  // --- CALCULOS AVANZADOS ---
  const kpiData = useMemo(() => {
    const totalVariableCosts = data.movements.filter(m => m.type === 'OUT').reduce((a, b) => a + b.calculatedCost, 0) + data.laborLogs.reduce((a, b) => a + b.value, 0) * laborFactor;
    const depreciationCost = data.assets.reduce((acc, asset) => acc + (asset.purchasePrice / asset.lifespanYears), 0);
    const totalFixedCosts = depreciationCost + (parseFloat(arriendoFigurado) || 0) * 12; // Anualizado
    const totalSales = data.harvests.reduce((a, b) => a + b.totalValue, 0);
    const totalHarvestKg = data.harvests.reduce((a, b) => a + b.quantity, 0);
    const totalArea = data.costCenters.reduce((a,b) => a+b.area, 0) || 1;
    
    // Cost Structure
    const laborCost = data.laborLogs.reduce((a, b) => a + b.value, 0) * laborFactor;
    const supplyCost = data.movements.filter(m => m.type === 'OUT').reduce((a, b) => a + b.calculatedCost, 0);
    const adminCost = data.financeLogs.filter(f => f.type === 'EXPENSE').reduce((a, b) => a + b.amount, 0) + (depreciationCost / 12);
    const costStructureData = [
        { label: 'Mano de Obra', value: laborCost, color: '#f59e0b' },
        { label: 'Insumos', value: supplyCost, color: '#10b981' },
        { label: 'Administrativos', value: adminCost, color: '#6366f1' }
    ];

    // Break-Even Point
    const avgSalePricePerKg = totalHarvestKg > 0 ? totalSales / totalHarvestKg : 0;
    const avgVarCostPerKg = totalHarvestKg > 0 ? totalVariableCosts / totalHarvestKg : 0;
    const contributionMarginPerKg = avgSalePricePerKg - avgVarCostPerKg;
    const breakEvenKg = contributionMarginPerKg > 0 ? totalFixedCosts / contributionMarginPerKg : Infinity;

    // Burn Rate (Simplified to monthly expenses)
    const burnRate = (laborCost + supplyCost + adminCost + totalFixedCosts/12) / 12;

    const lotCalculations = data.costCenters.map(lot => {
        const lotSales = data.harvests.filter(h => h.costCenterId === lot.id).reduce((a,b) => a + b.totalValue, 0);
        const lotHarvestKg = data.harvests.filter(h => h.costCenterId === lot.id).reduce((a,b) => a + b.quantity, 0);
        const lotLabor = data.laborLogs.filter(l => l.costCenterId === lot.id).reduce((a,b) => a + b.value, 0) * laborFactor;
        const lotSupplies = data.movements.filter(m => m.costCenterId === lot.id).reduce((a,b) => a + b.calculatedCost, 0);
        const lotTotalCost = lotLabor + lotSupplies;

        return {
            ...lot,
            cup: lotHarvestKg > 0 ? lotTotalCost / lotHarvestKg : 0,
            yieldHa: lot.area > 0 ? lotHarvestKg / lot.area : 0,
            laborEfficiency: lotHarvestKg > 0 ? lotLabor / lotHarvestKg : 0,
            net: lotSales - lotTotalCost,
            opex: lotTotalCost,
        }
    });

    // CAPEX vs OPEX
    const capexLots = lotCalculations.filter(l => l.stage === 'Levante');
    const opexLots = lotCalculations.filter(l => l.stage === 'Produccion');
    const totalCapex = capexLots.reduce((a, b) => a + b.opex, 0);
    const totalOpex = opexLots.reduce((a, b) => a + b.opex, 0);
    const laborIntensity = (data.laborLogs.length * 8) / totalArea;

    return { costStructureData, breakEvenKg, burnRate, lotCalculations, totalCapex, totalOpex, laborIntensity };

  }, [data, laborFactor, arriendoFigurado]);

  // --- POLYCULTURE ANALYSIS ---
  const polycultureData = useMemo(() => {
      const stats: Record<string, { income: number; directLabor: number; directInputs: number; area: number }> = {
          'Café': { income: 0, directLabor: 0, directInputs: 0, area: 0 },
          'Plátano': { income: 0, directLabor: 0, directInputs: 0, area: 0 },
          'Otro': { income: 0, directLabor: 0, directInputs: 0, area: 0 },
          'Conjunto': { income: 0, directLabor: 0, directInputs: 0, area: 0 } // For Joint Costs
      };

      // 1. Map Lots to Crops
      const lotMap = new Map(data.costCenters.map(c => [c.id, c.cropType]));
      
      // Calculate Total Areas for Allocation
      data.costCenters.forEach(c => {
          const key = (c.cropType === 'Café' || c.cropType === 'Plátano') ? c.cropType : 'Otro';
          stats[key].area += c.area;
      });

      // 2. Allocate Harvest Income (Direct)
      data.harvests.forEach(h => {
          // Heuristic: Check crop name string to bucket revenue
          const name = h.cropName.toLowerCase();
          let key = 'Otro';
          if (name.includes('caf') || name.includes('pergamino') || name.includes('cereza')) key = 'Café';
          else if (name.includes('platano') || name.includes('plátano') || name.includes('banano')) key = 'Plátano';
          
          if (stats[key]) stats[key].income += h.totalValue;
      });

      // 3. Allocate Labor Costs (Using Activity Classification)
      data.laborLogs.forEach(l => {
          const activity = data.activities.find(a => a.id === l.activityId);
          const classification = activity?.costClassification || 'JOINT';
          const cost = l.value * laborFactor;

          if (classification === 'COFFEE') stats['Café'].directLabor += cost;
          else if (classification === 'PLANTAIN') stats['Plátano'].directLabor += cost;
          else if (classification === 'OTHER') stats['Otro'].directLabor += cost;
          else stats['Conjunto'].directLabor += cost; // JOINT
      });

      // 4. Allocate Inputs (Based on Lot Type)
      data.movements.filter(m => m.type === 'OUT').forEach(m => {
          if (!m.costCenterId) return;
          const lotType = lotMap.get(m.costCenterId);
          let key = 'Otro';
          if (lotType === 'Café') key = 'Café';
          else if (lotType === 'Plátano' || lotType === 'Banano') key = 'Plátano';
          
          if (stats[key]) stats[key].directInputs += m.calculatedCost;
      });

      return stats;
  }, [data, laborFactor]);

  // --- BENCHMARK METRICS CALCULATION (NEW) ---
  const cropBenchmarks = useMemo(() => {
    return CALDAS_BENCHMARKS.map(bench => {
        // 1. Identify lots for this crop type
        const lots = data.costCenters.filter(c => c.cropType.toLowerCase().includes(bench.crop.toLowerCase()));
        const lotIds = lots.map(l => l.id);
        
        // 2. Calculate Totals
        const totalArea = lots.reduce((a,b) => a + b.area, 0);
        
        // Harvests
        const cropHarvests = data.harvests.filter(h => lotIds.includes(h.costCenterId));
        const totalKg = cropHarvests.reduce((a,b) => a + b.quantity, 0);
        
        // Costs
        const laborRaw = data.laborLogs.filter(l => lotIds.includes(l.costCenterId)).reduce((a,b) => a + b.value, 0) * laborFactor;
        const inputsRaw = data.movements.filter(m => m.type === 'OUT' && lotIds.includes(m.costCenterId || '')).reduce((a,b) => a + b.calculatedCost, 0);
        const totalCost = laborRaw + inputsRaw;

        // 3. Metrics Calculation
        const actualYield = totalArea > 0 ? totalKg / totalArea : 0;
        const actualCup = totalKg > 0 ? totalCost / totalKg : 0; // Costo por Kilo
        const actualLaborPart = totalCost > 0 ? laborRaw / totalCost : 0; // % Mano de Obra

        return {
            name: bench.crop,
            benchYield: bench.yield,
            benchLabor: bench.laborPart,
            actualYield,
            actualCup,
            actualLaborPart,
            hasData: totalArea > 0
        };
    });
  }, [data, laborFactor]);


  return (
    <div className="space-y-8 pb-32 animate-fade-in">
        <div className="bg-slate-900 p-8 rounded-[3.5rem] border border-slate-700 shadow-2xl text-center">
             <div className="flex items-center justify-center gap-3 mb-2">
                 <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg"><BrainCircuit className="w-6 h-6 text-white" /></div>
                 <h2 className="text-white font-black text-2xl uppercase tracking-tighter">Motor de Inteligencia de Negocios</h2>
             </div>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Del Dato Bruto a la Decisión Estratégica</p>
        </div>

        {/* --- CROP COMPARISON (POLYCULTURE) --- */}
        <div className="space-y-4">
            <h3 className="font-black text-white flex items-center gap-2 uppercase text-sm tracking-widest">
                <Split className="w-5 h-5 text-indigo-500" /> Rentabilidad por Cultivo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['Café', 'Plátano'].map(crop => {
                    const s = polycultureData[crop];
                    const grossMargin = s.income - (s.directLabor + s.directInputs);
                    return (
                        <div key={crop} className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 relative overflow-hidden group">
                            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
                                <Sprout className={`w-24 h-24 ${crop === 'Café' ? 'text-red-500' : 'text-yellow-500'}`} />
                            </div>
                            <div className="relative z-10">
                                <h4 className="font-black text-xl text-white mb-4 flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${crop === 'Café' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                                    {crop}
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold">Ventas Totales</span>
                                        <span className="text-emerald-400 font-mono font-black">{formatCurrency(s.income)}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold">Labor Directa</span>
                                        <span className="text-slate-300 font-mono text-xs">- {formatCurrency(s.directLabor)}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold">Insumos Directos</span>
                                        <span className="text-slate-300 font-mono text-xs">- {formatCurrency(s.directInputs)}</span>
                                    </div>
                                    <div className="pt-2 mt-2 border-t border-slate-700 flex justify-between items-end">
                                        <span className="text-xs text-indigo-400 uppercase font-black">Margen Directo</span>
                                        <span className={`text-lg font-mono font-black ${grossMargin >= 0 ? 'text-white' : 'text-red-500'}`}>
                                            {formatCurrency(grossMargin)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* JOINT COSTS CARD */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-dashed border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg"><Users className="w-4 h-4 text-slate-400"/></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Costos Conjuntos (Compartidos)</p>
                        <p className="text-[9px] text-slate-500">Mano de obra general no asignable a un solo cultivo.</p>
                    </div>
                </div>
                <p className="text-lg font-mono font-black text-amber-500">- {formatCurrency(polycultureData['Conjunto'].directLabor)}</p>
            </div>
        </div>

        {/* --- BENCHMARKS & KEY METRICS (NEW SECTION) --- */}
        <div className="space-y-4">
            <h3 className="font-black text-white flex items-center gap-2 uppercase text-sm tracking-widest">
                <BookOpen className="w-5 h-5 text-emerald-500" /> Benchmarks de Cultivo & Métricas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cropBenchmarks.map(bench => (
                    <div key={bench.name} className={`bg-slate-900 p-5 rounded-3xl border border-slate-700 ${!bench.hasData ? 'opacity-60' : ''}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-black text-white uppercase text-sm flex items-center gap-2">
                                <Sprout className="w-4 h-4 text-emerald-500" /> {bench.name}
                            </h4>
                            {!bench.hasData && <span className="text-[9px] bg-slate-800 text-slate-500 px-2 py-1 rounded">Sin Datos</span>}
                        </div>
                        
                        <div className="space-y-3">
                            {/* Costo Por Kilo */}
                            <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-xl">
                                <div>
                                    <p className="text-[9px] text-slate-400 font-black uppercase">Costo por Kilo</p>
                                    <p className="text-lg font-mono font-black text-white">{formatCurrency(bench.actualCup || 0)} <span className="text-[10px] text-slate-500">/Kg</span></p>
                                </div>
                                <DollarSign className="w-5 h-5 text-emerald-600 opacity-50" />
                            </div>

                            {/* Rendimiento Comparativo */}
                            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                <span className="text-[10px] text-slate-500 uppercase font-bold">Rendimiento (Kg/Ha)</span>
                                <div className="text-right">
                                    <span className="text-sm font-black text-white">{(bench.actualYield || 0).toFixed(0)}</span>
                                    <span className="text-[9px] text-slate-500 ml-2">Esperado: {bench.benchYield}</span>
                                </div>
                            </div>

                            {/* Participacion Laboral */}
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-500 uppercase font-bold">Participación Mano de Obra</span>
                                <div className="text-right">
                                    <span className={`text-sm font-black ${(bench.actualLaborPart > bench.benchLabor) ? 'text-amber-500' : 'text-emerald-500'}`}>
                                        {((bench.actualLaborPart || 0) * 100).toFixed(1)}%
                                    </span>
                                    <span className="text-[9px] text-slate-500 ml-2">Ref: {((bench.benchLabor || 0) * 100).toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* --- FINANCIAL KPIs --- */}
        <div className="space-y-4">
            <h3 className="font-black text-white flex items-center gap-2 uppercase text-sm tracking-widest"><Scale className="w-5 h-5 text-blue-500" /> KPIs Financieros Globales</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPI_Card title="Punto de Equilibrio" value={isFinite(kpiData.breakEvenKg) ? `${(kpiData.breakEvenKg || 0).toFixed(0)} Kg` : 'N/A'} subvalue="Para cubrir costos fijos" color="text-emerald-400" icon={Landmark} />
                <KPI_Card title="Tasa de Gasto Mensual" value={formatCurrency(kpiData.burnRate || 0)} subvalue="Burn Rate Operativo" color="text-red-400" icon={Timer} />
                <div className="md:col-span-1 bg-slate-950/50 p-6 rounded-3xl border border-slate-800">
                     <p className="text-[10px] font-black text-indigo-400 uppercase mb-3 flex items-center gap-2"><PieChart className="w-4 h-4" /> Estructura de Costos</p>
                     <PieChartSVG data={kpiData.costStructureData} />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <KPI_Card title="Inversión (CAPEX)" value={formatCurrency(kpiData.totalCapex || 0)} subvalue="Costos de Levante y siembra" color="text-blue-400" icon={Briefcase} />
                 <KPI_Card title="Operación (OPEX)" value={formatCurrency(kpiData.totalOpex || 0)} subvalue="Costos de Producción" color="text-purple-400" icon={ActivityIcon} />
            </div>
        </div>

        {/* --- OPERATIONAL KPIs --- */}
        <div className="space-y-4">
            <h3 className="font-black text-white flex items-center gap-2 uppercase text-sm tracking-widest"><Zap className="w-5 h-5 text-amber-500" /> KPIs Operativos y Productividad</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <KPI_Card title="Intensidad Laboral" value={`${(kpiData.laborIntensity || 0).toFixed(1)}`} subvalue="Horas-Hombre / Hectárea" color="text-indigo-400" icon={Users} />
                {kpiData.lotCalculations.filter(l => l.stage === 'Produccion').slice(0,1).map(lot => ( // Show only first production lot for brevity
                    <div key={lot.id} className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 space-y-4">
                         <h4 className="font-black text-white text-base border-b border-slate-800 pb-2 mb-4">{lot.name}</h4>
                         <div className="grid grid-cols-3 gap-2 text-center">
                             <div>
                                <p className="text-[9px] font-black text-amber-400 uppercase">Costo/Kg (CUP)</p>
                                <p className="text-lg font-mono font-bold text-white">{formatCurrency(lot.cup || 0)}</p>
                             </div>
                             <div>
                                <p className="text-[9px] font-black text-amber-400 uppercase">Rendimiento</p>
                                <p className="text-lg font-mono font-bold text-white">{(lot.yieldHa || 0).toFixed(0)} <span className="text-xs">Kg/Ha</span></p>
                             </div>
                             <div>
                                <p className="text-[9px] font-black text-amber-400 uppercase">Costo Laboral</p>
                                <p className="text-lg font-mono font-bold text-white">{formatCurrency(lot.laborEfficiency || 0)}<span className="text-xs">/Kg</span></p>
                             </div>
                         </div>
                    </div>
                ))}
            </div>
        </div>
        
        {/* --- RENTABILIDAD POR LOTE --- */}
        <div className="space-y-4">
            <h3 className="font-black text-white flex items-center gap-2 uppercase text-sm tracking-widest"><Target className="w-5 h-5 text-blue-500" /> Rentabilidad por Lote</h3>
            <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 space-y-3">
                 {kpiData.lotCalculations.map(lot => (
                    <div key={lot.id} className="flex justify-between items-center text-xs border-b border-slate-800/50 pb-2">
                        <span className="text-white font-bold">{lot.name}</span>
                        <span className={`font-mono font-black ${lot.net >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrency(lot.net || 0)}</span>
                    </div>
                 ))}
            </div>
        </div>

        {/* --- HERRAMIENTAS DE VIABILIDAD DE PROYECTOS (NEW SECTION) --- */}
        <div className="space-y-4 pt-4">
            <h3 className="font-black text-white flex items-center gap-2 uppercase text-sm tracking-widest">
                <DollarSign className="w-5 h-5 text-indigo-500" /> Herramientas de Viabilidad de Proyectos
            </h3>
            <InvestmentCalculatorView /> {/* Render the new component here */}
        </div>

    </div>
  );
};
