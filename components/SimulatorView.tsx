
import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, Sprout, TrendingUp, DollarSign, Ruler, Clock, Briefcase, ChevronDown, Scale, TrendingDown, AlertTriangle, Target, CheckCircle2, Info, Leaf, ArrowRight, Wallet, Coins, Download, FileSpreadsheet, FileText, Landmark, Activity, ChevronUp, PieChart, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../services/inventoryService';
import { generateSimulatorPDF, generateSimulatorExcel } from '../services/reportService';
import { LaborLog, HarvestLog, InventoryItem } from '../types';

interface SimulatorViewProps {
    laborLogs?: LaborLog[];
    harvests?: HarvestLog[];
    inventory?: InventoryItem[];
}

const TECHNICAL_STANDARDS = {
    establishment: { ahoyado_siembra_jornales_mil: 18 },
    maintenance: {
        fertilizacion_kg_ha_año: 1400, 
        jornales_mantenimiento_ha: 142,
        breakdown_jornales: { arvenses: 0.35, fitosanitario: 0.25, otros: 0.40 }
    },
    production: { factor_carga: 125, merma_beneficio: 5.25 }
};

const PRODUCTION_CURVE = [
    { year: 1, percent: 0, fertFactor: 0.45, label: 'Siembra y Establecimiento', stage: 'CAPEX' }, 
    { year: 2, percent: 0, fertFactor: 0.75, label: 'Levante Vegetativo', stage: 'CAPEX' }, 
    { year: 3, percent: 0.35, fertFactor: 0.90, label: 'Inicio Cosecha (Zoca)', stage: 'OPEX' }, 
    { year: 4, percent: 0.85, fertFactor: 1.00, label: 'Rampa de Producción', stage: 'OPEX' },
    { year: 5, percent: 1.00, fertFactor: 1.00, label: 'Plena Producción (Pico)', stage: 'OPEX' },
    { year: 6, percent: 0.80, fertFactor: 1.00, label: 'Meseta Productiva', stage: 'OPEX' },
    { year: 7, percent: 0.55, fertFactor: 1.00, label: 'Declive de Tejido', stage: 'OPEX' },
];

export const SimulatorView: React.FC<SimulatorViewProps> = ({ laborLogs = [], harvests = [], inventory = [] }) => {
    // Parámetros comerciales - Valores por defecto robustos
    const [totalTrees, setTotalTrees] = useState(5000);
    const [density, setDensity] = useState(5000); 
    const [coffeeLoadPrice, setCoffeeLoadPrice] = useState(2150000); 
    const [jornalValue, setJornalValue] = useState(85000); 
    const [fertilizerPriceBulto, setFertilizerPriceBulto] = useState(175000); 
    const [seedlingCost, setSeedlingCost] = useState(2400); 
    const [harvestCostPerKg, setHarvestCostPerKg] = useState(1150); 
    const [peakYieldPerTree, setPeakYieldPerTree] = useState(2.8); 
    const [monthlyGoal, setMonthlyGoal] = useState(3000000);
    
    // UI States
    const [expandedYear, setExpandedYear] = useState<number | null>(null);
    const [viewMetric, setViewMetric] = useState<'total' | 'hectarea' | 'arbol'>('total');

    // --- MOTOR DE SINCRONIZACIÓN CON DATOS REALES ---
    const handleSyncRealData = () => {
        // 1. Calcular promedio real de venta (últimas 10 cosechas)
        if (harvests.length > 0) {
            const recentHarvests = harvests.slice(-10);
            const avgLoadPrice = recentHarvests.reduce((sum, h) => sum + (h.totalValue / (h.quantity / 125)), 0) / recentHarvests.length;
            if (avgLoadPrice > 0) setCoffeeLoadPrice(Math.round(avgLoadPrice));
        }

        // 2. Calcular costo real de mano de obra
        if (laborLogs.length > 0) {
            const recentLabor = laborLogs.slice(-20);
            const avgJornal = recentLabor.reduce((sum, l) => sum + l.value, 0) / recentLabor.length;
            if (avgJornal > 0) setJornalValue(Math.round(avgJornal));
        }

        // 3. Buscar precio real de fertilizante en bodega
        const fertilizers = inventory.filter(i => i.category === 'Fertilizante');
        if (fertilizers.length > 0) {
            const avgPrice = fertilizers.reduce((sum, f) => sum + (f.lastPurchasePrice), 0) / fertilizers.length;
            if (avgPrice > 0) setFertilizerPriceBulto(Math.round(avgPrice));
        }
    };

    // Auto-sync al cargar por primera vez si hay datos
    useEffect(() => {
        if (harvests.length > 0 || laborLogs.length > 0) {
            handleSyncRealData();
        }
    }, []);

    const calculation = useMemo(() => {
        const areaHa = totalTrees / density;
        let investmentTotal = 0;
        const annualLandRent = 1800000 * areaHa;
        const annualAdminFee = 2500000 * areaHa;
        const annualFixedCosts = annualLandRent + annualAdminFee; 

        let totalRevenueCycle = 0;
        let totalExpensesCycle = 0;
        let totalCargasProduced = 0;

        const totalBreakdown = { administracion: 0, tierra: 0, fertilizacion: 0, arvenses: 0, sanidad: 0, mantenimientoGral: 0, recoleccion: 0, establecimiento: 0, imprevistos: 0 };

        const yearlyData = PRODUCTION_CURVE.map(curve => {
            const yieldKgCereza = (peakYieldPerTree * curve.percent) * totalTrees; 
            const yieldKgCPS = yieldKgCereza / TECHNICAL_STANDARDS.production.merma_beneficio; 
            const yieldCargas = yieldKgCPS / TECHNICAL_STANDARDS.production.factor_carga;
            const income = yieldCargas * coffeeLoadPrice;
            const costHarvest = yieldKgCereza * harvestCostPerKg; 
            const fertKg = TECHNICAL_STANDARDS.maintenance.fertilizacion_kg_ha_año * areaHa * curve.fertFactor;
            const costFert = fertKg * (fertilizerPriceBulto / 50);
            const totalLaborMaintCost = (TECHNICAL_STANDARDS.maintenance.jornales_mantenimiento_ha * areaHa * jornalValue);
            const setupCosts = curve.year === 1 ? (totalTrees * seedlingCost) : 0;
            const opexSubtotal = costFert + totalLaborMaintCost + setupCosts + annualFixedCosts;
            const contingency = opexSubtotal * 0.10; 
            const totalCost = opexSubtotal + costHarvest + contingency;
            const profit = income - totalCost;

            if (curve.year <= 2) investmentTotal += Math.abs(profit);
            totalRevenueCycle += income; totalExpensesCycle += totalCost; totalCargasProduced += yieldCargas;

            totalBreakdown.administracion += annualAdminFee; totalBreakdown.tierra += annualLandRent; totalBreakdown.fertilizacion += costFert;
            totalBreakdown.arvenses += totalLaborMaintCost * 0.35; totalBreakdown.sanidad += totalLaborMaintCost * 0.25;
            totalBreakdown.mantenimientoGral += totalLaborMaintCost * 0.40; totalBreakdown.recoleccion += costHarvest;
            totalBreakdown.establecimiento += setupCosts; totalBreakdown.imprevistos += contingency;

            return { year: curve.year, label: curve.label, stage: curve.stage, income, totalCost, profit, yieldCargas, breakdown: { administracion: annualAdminFee, tierra: annualLandRent, fertilizacion: costFert, arvenses: totalLaborMaintCost * 0.35, sanidad: totalLaborMaintCost * 0.25, mantenimientoGral: totalLaborMaintCost * 0.40, recoleccion: costHarvest, establecimiento: setupCosts, imprevistos: contingency } };
        });

        const annualAmortization = investmentTotal / 5;
        let currentAccumulated = -investmentTotal;

        const adjustedYearly = yearlyData.map(y => {
            const amortCharge = y.year > 2 ? annualAmortization : 0;
            const realNetProfit = y.profit - amortCharge;
            if (y.year > 2) currentAccumulated += y.profit; 
            return { ...y, realNetProfit, marginPct: y.income > 0 ? (realNetProfit / y.income) * 100 : -100, accumulated: currentAccumulated };
        });

        return {
            yearlyData: adjustedYearly,
            netMargin: ((totalRevenueCycle - totalExpensesCycle) / totalRevenueCycle) * 100,
            annualizedROI: investmentTotal > 0 ? (((totalRevenueCycle - totalExpensesCycle) / investmentTotal) / 7) * 100 : 0,
            maxInvestment: investmentTotal,
            avgMonthlyTotal: (totalRevenueCycle - totalExpensesCycle) / (7 * 12),
            costPerCarga: totalExpensesCycle / totalCargasProduced,
            totalCargas: totalCargasProduced,
            areaHa
        };
    }, [totalTrees, density, coffeeLoadPrice, jornalValue, fertilizerPriceBulto, seedlingCost, harvestCostPerKg, peakYieldPerTree]);

    const reverseCalc = useMemo(() => {
        const profitPerTreeMonth = calculation.avgMonthlyTotal / totalTrees;
        if (profitPerTreeMonth <= 0) return { trees: 0, area: 0, error: 'MODELO EN PÉRDIDA' };
        const treesNeeded = Math.ceil(monthlyGoal / profitPerTreeMonth);
        return { trees: treesNeeded, area: treesNeeded / density, error: null };
    }, [monthlyGoal, calculation.avgMonthlyTotal, totalTrees, density]);

    const formatByMetric = (val: number) => {
        if (viewMetric === 'hectarea') return formatCurrency(val / calculation.areaHa);
        if (viewMetric === 'arbol') return formatCurrency(val / totalTrees);
        return formatCurrency(val);
    };

    return (
        <div className="space-y-8 pb-32 animate-fade-in">
            <div className="bg-slate-950 p-8 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden text-center">
                <div className="absolute top-0 right-0 p-6 opacity-5"><Landmark className="w-40 h-40 text-white" /></div>
                <div className="relative z-10">
                    <h2 className="text-white font-black text-2xl uppercase tracking-tighter mb-2 italic">Simulador Inteligente</h2>
                    <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em] bg-emerald-500/10 inline-block px-4 py-1 rounded-full border border-emerald-500/20">
                        Sincronizado con tus datos reales de campo
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-black text-slate-800 dark:text-white uppercase text-[10px] flex items-center gap-2">
                                <Scale className="w-4 h-4 text-indigo-500" /> Variables de Ciclo
                            </h3>
                            <button onClick={handleSyncRealData} className="p-2 bg-indigo-600/10 text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">
                                <RefreshCw className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Precio Carga Venta (Real)</label>
                                <input type="number" value={coffeeLoadPrice} onChange={e => setCoffeeLoadPrice(Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-emerald-600 font-mono font-black text-xl outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <label className="text-[9px] font-black text-slate-500 uppercase">Población Árb.</label>
                                    <input type="number" value={totalTrees} onChange={e => setTotalTrees(Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-slate-800 dark:text-white font-mono font-black text-sm" />
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <label className="text-[9px] font-black text-slate-500 uppercase">Valor Jornal</label>
                                    <input type="number" value={jornalValue} onChange={e => setJornalValue(Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-slate-800 dark:text-white font-mono font-black text-sm" />
                                </div>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Precio Bulto Fertilizante</label>
                                <input type="number" value={fertilizerPriceBulto} onChange={e => setFertilizerPriceBulto(Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-amber-600 font-mono font-black text-lg outline-none" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-700 shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <Activity className="w-5 h-5 text-emerald-500" />
                            <h4 className="text-white font-black text-[10px] uppercase tracking-widest">Utilidad Neta Mensual</h4>
                        </div>
                        <p className={`text-3xl font-mono font-black ${calculation.avgMonthlyTotal > 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                            {formatCurrency(calculation.avgMonthlyTotal)}
                        </p>
                        <p className="text-[9px] text-slate-500 mt-2 italic leading-relaxed">
                            {calculation.avgMonthlyTotal <= 0 ? 'Tu estructura de costos actual es superior a los ingresos promedio.' : 'Promedio proyectado considerando amortización de la inversión inicial.'}
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-gradient-to-br from-indigo-900 to-slate-950 p-8 rounded-[3rem] border border-indigo-500/30 shadow-2xl">
                        <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
                            <div className="text-left space-y-2">
                                <div className="flex items-center gap-2 text-indigo-300 font-black uppercase text-xs">
                                    <Target className="w-5 h-5" /> Escalamiento Productivo
                                </div>
                                <h4 className="text-white text-xl font-bold">Meta de Retorno Mensual</h4>
                                <p className="text-slate-400 text-xs italic">¿Cuánta tierra necesito para ganar <span className="text-white font-black">{formatCurrency(monthlyGoal)}</span>?</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <div className="bg-black/30 p-4 rounded-2xl border border-white/10 text-center">
                                    <p className="text-[9px] text-indigo-400 font-black uppercase mb-1">Tu Objetivo Mensual</p>
                                    <input type="number" value={monthlyGoal} onChange={e => setMonthlyGoal(Number(e.target.value))} className="bg-transparent border-none p-0 text-white font-mono font-black text-2xl text-center outline-none w-40" />
                                </div>
                                <div className="hidden sm:block text-indigo-500"><ArrowRight className="w-6 h-6" /></div>
                                <div className={`p-5 rounded-[2rem] shadow-xl text-center transition-all ${reverseCalc.error ? 'bg-red-600' : 'bg-emerald-600'} text-white`}>
                                    <p className="text-[10px] font-black uppercase mb-1 opacity-80">{reverseCalc.error ? 'Advertencia' : 'Capacidad Requerida'}</p>
                                    <p className="text-3xl font-black">{reverseCalc.error ? '0' : reverseCalc.trees.toLocaleString()}</p>
                                    <p className="text-[10px] font-bold uppercase mt-1">{reverseCalc.error ? 'Ajusta variables de rentabilidad' : `${reverseCalc.area.toFixed(2)} Hectáreas`}</p>
                                </div>
                            </div>
                        </div>
                        {reverseCalc.error && (
                            <div className="mt-4 bg-black/40 p-4 rounded-2xl flex items-start gap-3 border border-red-500/30">
                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                                <p className="text-[10px] text-red-200 leading-tight">
                                    <strong>Rentabilidad Crítica:</strong> Actualmente el costo de producción ({formatCurrency(calculation.costPerCarga)}/Carga) es muy cercano o superior al precio de venta. No es posible proyectar escalamiento hasta mejorar la eficiencia o el precio.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Costo Fijo Ha/Año</p>
                            <p className="text-2xl font-mono font-black text-slate-800 dark:text-white">{formatCurrency(4300000)}</p>
                            <p className="text-[8px] text-slate-500 mt-1 italic">Tierra + Administración</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">ROI Anualizado</p>
                            <p className="text-2xl font-mono font-black text-emerald-600">{calculation.annualizedROI.toFixed(1)}%</p>
                            <p className="text-[8px] text-slate-500 mt-1 italic">Retorno sobre Inversión</p>
                        </div>
                        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-700 shadow-xl">
                            <p className="text-[9px] font-black text-indigo-400 uppercase mb-1">Costo x Carga (Total)</p>
                            <p className="text-2xl font-mono font-black text-white">{formatCurrency(calculation.costPerCarga)}</p>
                            <p className="text-[8px] text-slate-500 mt-1 italic">CPS (125Kg)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
