
import React, { useState, useMemo } from 'react';
import { 
  Calculator, Sprout, TrendingUp, DollarSign, Clock, Layers, Zap, 
  Target, Wallet, FlaskConical, Pickaxe, ArrowRight, 
  ChevronRight, Percent, Scale, Package, Landmark, 
  BarChart3, Lightbulb, Gem, ArrowUpRight, Coffee, Layout, Info, 
  AlertTriangle, Activity, User, ShieldAlert, TrendingDown, Timer, 
  CheckCircle2, ShieldX, ShieldCheck, Landmark as Bank, CloudRain, 
  TrendingUp as Trend, Coins, Repeat, LayoutGrid, ArrowDownRight, 
  Split, MapPin, Sun, Save, Copy, Trash2, ZapOff, Flame, Wind, 
  FileDown, Microscope, GraduationCap, Briefcase, Settings, 
  Tags, SearchCode, History
} from 'lucide-react';
import { formatCurrency, formatNumberInput, parseNumberInput } from '../services/inventoryService';
import { generateSimulationPDF } from '../services/reportService';

interface SimulationYear {
    year: number;
    productionPerc: number;
    totalProductionKg: number;
    capex: number;
    opex: number; // Sostenimiento
    harvestCost: number; // Recolección
    renovationReserve: number; // Fondo de reserva
    debtService: number;
    incomeCoffee: number;
    incomePlantain: number;
    totalIncome: number;
    netCashFlow: number;
    cumulativeFlow: number;
    isExhaustionYear: boolean;
}

type TechLevel = 'TRADITIONAL' | 'SEMI' | 'HIGH_TECH';
type Variety = 'CASTILLO' | 'CENICAFE1' | 'PORTE_ALTO' | 'PORTE_BAJO';
type CrisisEvent = 'NONE' | 'NINO' | 'PRICE_CRISIS' | 'BONANZA';

const TECH_CONFIG = {
  'TRADITIONAL': { label: 'Tradicional', costFactor: 0.85, yieldFactor: 0.75, icon: Pickaxe },
  'SEMI': { label: 'Semi-Tecnificado', costFactor: 1.0, yieldFactor: 1.0, icon: Settings },
  'HIGH_TECH': { label: 'Alta Tecnología', costFactor: 1.3, yieldFactor: 1.4, icon: Zap }
};

const VARIETY_CONFIG = {
  'CASTILLO': { label: 'Castillo (Resistente)', densityLimit: 10000, peakYear: 4, exhaustionFactor: 0.2 },
  'CENICAFE1': { label: 'Cenicafé 1', densityLimit: 9000, peakYear: 4, exhaustionFactor: 0.15 },
  'PORTE_ALTO': { label: 'Variedades Porte Alto', densityLimit: 5000, peakYear: 5, exhaustionFactor: 0.05 },
  'PORTE_BAJO': { label: 'Variedades Porte Bajo', densityLimit: 12000, peakYear: 3, exhaustionFactor: 0.3 }
};

export const SimulatorView: React.FC = () => {
    // --- ESTADOS DEL ECOSISTEMA TÉCNICO ---
    const [activeTab, setActiveTab] = useState<'PROJECTION' | 'INVESTMENT' | 'STRESS'>('PROJECTION');
    const [techLevel, setTechLevel] = useState<TechLevel>('SEMI');
    const [variety, setVariety] = useState<Variety>('CASTILLO');
    const [activeCrisis, setActiveCrisis] = useState<CrisisEvent>('NONE');
    
    // Inputs Base
    const [mode, setMode] = useState<'SINGLE' | 'COMBINED'>('COMBINED');
    const [numTrees, setNumTrees] = useState('10000');
    const [density, setDensity] = useState('7500'); 
    const [marketPrice, setMarketPrice] = useState('1850000');
    const [plantainPrice, setPlantainPrice] = useState('2500');
    const [jornalValue, setJornalValue] = useState('75000');
    const [inflation, setInflation] = useState('5'); 

    // --- NUEVAS VARIABLES AGRONÓMICAS DE PRECISIÓN ---
    const [harvestCostPerKg, setHarvestCostPerKg] = useState('750'); // COP por Kg recolectado
    const [qualityFactor, setQualityFactor] = useState('94'); // Factor de rendimiento (Base 94)
    const [reservePercent, setReservePercent] = useState('8'); // % para fondo de renovación

    const [includeCredit, setIncludeCredit] = useState(false);
    const [loanAmount, setLoanAmount] = useState('50000000');
    const [interestRate, setInterestRate] = useState('14'); 
    const [loanYears, setLoanYears] = useState('5');

    // --- MOTOR DE CÁLCULO FINANCIERO AGRO v2.7 ---
    const simulation = useMemo(() => {
        const totalPlants = parseNumberInput(numTrees) || 1;
        const dens = parseNumberInput(density) || 1;
        const hectares = totalPlants / dens;
        const jVal = parseNumberInput(jornalValue);
        const pCoffeeBase = parseNumberInput(marketPrice);
        const pPlantain = parseNumberInput(plantainPrice);
        const infl = (parseNumberInput(inflation) / 100) + 1;
        
        const hCostKg = parseNumberInput(harvestCostPerKg);
        const qFactorBase = parseNumberInput(qualityFactor);
        const resPerc = parseNumberInput(reservePercent) / 100;

        const tech = TECH_CONFIG[techLevel];
        const varConfig = VARIETY_CONFIG[variety];
        
        let crisisYieldImpact = 1.0;
        let crisisPriceImpact = 1.0;
        let crisisQualityImpact = 0; // Incremento en el factor (más factor = peor calidad)
        
        if (activeCrisis === 'NINO') {
            crisisYieldImpact = 0.65; // -35% producción
            crisisQualityImpact = 11; // Sube factor de 94 a 105 (Broca/Pasilla)
        }
        if (activeCrisis === 'PRICE_CRISIS') crisisPriceImpact = 0.70; 
        if (activeCrisis === 'BONANZA') crisisPriceImpact = 1.40; 

        const principal = parseNumberInput(loanAmount);
        const rate = parseNumberInput(interestRate) / 100;
        const term = parseNumberInput(loanYears);
        const annualPrincipal = principal / term;

        const cycleYears = 6; 
        const yearlyData: SimulationYear[] = [];
        let cumulativeFlow = includeCredit ? 0 : -principal;
        let paybackYear: number | null = null;
        let totalCapex = 0;

        const interferenceFactor = mode === 'COMBINED' ? 0.88 : 1.0; 

        for (let i = 1; i <= cycleYears; i++) {
            const currentInflFactor = Math.pow(infl, i - 1);
            let prodPercCoffee = 0;
            let prodKgPlantain = 0;
            let yearCapex = 0;
            let yearOpex = 0; // Sostenimiento (fertilizantes + limpias)
            let debtService = 0;
            let isExhaustionYear = false;

            if (includeCredit && i <= term) {
                const remainingPrincipal = principal - (annualPrincipal * (i - 1));
                debtService = annualPrincipal + (remainingPrincipal * rate);
            }

            // Lógica Biológica de Crecimiento
            if (i === 1) { 
                yearCapex = (230 * jVal * tech.costFactor) * hectares * currentInflFactor; 
                if (mode === 'COMBINED') prodKgPlantain = 3800 * hectares; 
            }
            else if (i === 2) { 
                yearCapex = (100 * jVal * tech.costFactor) * hectares * currentInflFactor; 
                if (mode === 'COMBINED') prodKgPlantain = 5500 * hectares;
            }
            else if (i >= 3) {
                yearOpex = (160 * jVal * tech.costFactor) * hectares * currentInflFactor;
                if (i === 3) prodPercCoffee = variety === 'PORTE_BAJO' ? 0.55 : 0.40;
                else if (i === varConfig.peakYear) prodPercCoffee = 1.0;
                else if (i > varConfig.peakYear) {
                    prodPercCoffee = 0.85;
                    if (dens > varConfig.densityLimit * 0.8) {
                        prodPercCoffee *= (1 - varConfig.exhaustionFactor);
                        isExhaustionYear = true;
                    }
                } else {
                    prodPercCoffee = 0.75;
                }
            }

            // Cálculo de Producción Real en Kg (CPS)
            // Base: 22 cargas/Ha en pico (aprox 2750 kg/Ha)
            const baseProductionKg = (2750 * (dens/7000) * tech.yieldFactor) * hectares * prodPercCoffee * crisisYieldImpact * interferenceFactor;
            
            // AJUSTE POR CALIDAD (FACTOR DE RENDIMIENTO)
            // El precio de bolsa/federación es para Factor 94. 
            const currentFactor = qFactorBase + crisisQualityImpact;
            const priceQualityMultiplier = 94 / currentFactor;
            const currentPricePerKg = (pCoffeeBase / 125) * crisisPriceImpact * priceQualityMultiplier;

            // COSTO DE RECOLECCIÓN (Variable según producción)
            const yearHarvestCost = baseProductionKg * hCostKg * currentInflFactor;

            const incCoffee = baseProductionKg * currentPricePerKg;
            const incPlantain = prodKgPlantain * pPlantain * crisisYieldImpact;
            const totalIncome = incCoffee + incPlantain;

            // FONDO DE RENOVACIÓN (Reserva para Zoca Año 5/6)
            const renovationReserve = i >= 3 ? totalIncome * resPerc : 0;

            const totalYearExpenses = yearCapex + yearOpex + yearHarvestCost + renovationReserve + debtService;
            const netCashFlow = totalIncome - totalYearExpenses;
            
            cumulativeFlow += netCashFlow;
            if (paybackYear === null && cumulativeFlow >= 0) paybackYear = i;
            if (i <= 2) totalCapex += yearCapex;

            yearlyData.push({ 
                year: i, productionPerc: prodPercCoffee * 100, totalProductionKg: baseProductionKg,
                capex: yearCapex, opex: yearOpex, harvestCost: yearHarvestCost, 
                renovationReserve, debtService, incomeCoffee: incCoffee, 
                incomePlantain: incPlantain, totalIncome, netCashFlow, 
                cumulativeFlow, isExhaustionYear
            });
        }

        const vpn = yearlyData.reduce((acc, y) => acc + (y.netCashFlow / Math.pow(1.12, y.year)), includeCredit ? 0 : -principal);

        return {
            hectares, vpn, yearlyData, paybackYear, totalCapex,
            isHealthy: vpn > 0,
            roi: (vpn / (principal || 1)) * 100,
            hasCrisis: activeCrisis !== 'NONE',
            currentFactor: qFactorBase + crisisQualityImpact
        };
    }, [mode, numTrees, density, marketPrice, plantainPrice, jornalValue, inflation, includeCredit, loanAmount, interestRate, loanYears, techLevel, variety, activeCrisis, harvestCostPerKg, qualityFactor, reservePercent]);

    const handleExportPDF = () => {
        generateSimulationPDF(simulation, {
            techLabel: TECH_CONFIG[techLevel].label,
            varietyLabel: VARIETY_CONFIG[variety].label,
            numTrees: parseNumberInput(numTrees),
            density: parseNumberInput(density),
            marketPrice: marketPrice,
            harvestCostKg: harvestCostPerKg,
            qualityFactor: simulation.currentFactor
        });
    };

    return (
        <div className="space-y-6 pb-40 animate-fade-in">
            {/* --- CABECERA TÉCNICA --- */}
            <div className="bg-slate-900 border-b border-slate-800 p-6 flex flex-col md:flex-row justify-between items-center gap-4 -mx-4 -mt-4 sticky top-[120px] z-30 shadow-2xl">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-800 rounded-2xl shadow-lg border border-slate-700">
                        <Calculator className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-white font-black text-lg uppercase tracking-tighter">Terminal de Ingeniería Agro-Financiera</h2>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Lucas Mateo Tabares Franco • v2.7 PRO Agronómico</p>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <button onClick={handleExportPDF} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border border-emerald-500 shadow-lg active:scale-95 transition-all">
                        <FileDown className="w-3.5 h-3.5" /> Generar Factibilidad PDF
                    </button>
                </div>
            </div>

            {/* --- DASHBOARD DE RESULTADOS --- */}
            <div className={`p-8 rounded-[3.5rem] border-4 shadow-2xl relative overflow-hidden transition-all duration-700 ${simulation.isHealthy ? 'bg-slate-900 border-emerald-500/30' : 'bg-slate-900 border-red-500/30'}`}>
                <div className="absolute top-0 right-0 p-8 opacity-5"><Landmark className="w-64 h-64 text-white" /></div>
                
                <div className="relative z-10 flex flex-col lg:flex-row gap-10">
                    <div className="flex-1 space-y-6">
                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black text-slate-400 border border-white/10 uppercase tracking-widest">{TECH_CONFIG[techLevel].label}</span>
                            <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black text-slate-400 border border-white/10 uppercase tracking-widest">Calidad: Factor {simulation.currentFactor}</span>
                            {activeCrisis !== 'NONE' && <span className="px-3 py-1 bg-red-600 text-white rounded-full text-[9px] font-black border border-red-500 uppercase tracking-widest">Evento Activo: {activeCrisis}</span>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-950/50 p-6 rounded-[2.5rem] border border-slate-800">
                                <p className="text-[10px] text-slate-500 font-black uppercase flex items-center gap-2"><Target className="w-4 h-4 text-emerald-500"/> VPN del Proyecto</p>
                                <p className={`text-3xl font-black font-mono tracking-tighter ${simulation.vpn > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(simulation.vpn)}</p>
                            </div>
                            <div className="bg-slate-950/50 p-6 rounded-[2.5rem] border border-slate-800">
                                <p className="text-[10px] text-slate-500 font-black uppercase flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-500"/> Punto de Equilibrio</p>
                                <p className="text-3xl font-black text-white font-mono tracking-tighter">{simulation.paybackYear ? `Año ${simulation.paybackYear}` : 'Inválido'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-96 bg-slate-950/80 p-8 rounded-[3rem] border border-white/10 flex flex-col justify-center text-center shadow-2xl relative overflow-hidden group">
                        <div className={`w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center border-2 transition-all ${simulation.isHealthy ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-500' : 'bg-red-500/20 border-red-500/40 text-red-500'}`}>
                            {simulation.isHealthy ? <ShieldCheck className="w-10 h-10" /> : <ShieldAlert className="w-10 h-10" />}
                        </div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Índice ROI Real</p>
                        <p className={`text-6xl font-black font-mono tracking-tighter ${simulation.isHealthy ? 'text-emerald-500' : 'text-red-500'}`}>{simulation.roi.toFixed(1)}%</p>
                        <p className="text-[9px] text-slate-500 mt-4 uppercase font-bold italic">Análisis que incluye depreciación biológica y castigo por calidad.</p>
                    </div>
                </div>
            </div>

            {/* --- CONFIGURACIÓN DE VARIABLES CRÍTICAS --- */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-500" /> Parámetros Agronómicos y Sensibilidad
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-2">
                            <Pickaxe className="w-4 h-4 text-amber-500" /> Recolección ($/Kg)
                        </label>
                        <input type="text" value={formatNumberInput(harvestCostPerKg)} onChange={e => setHarvestCostPerKg(parseNumberInput(e.target.value).toString())} className="w-full bg-slate-50 dark:bg-slate-950 border-none rounded-2xl p-4 text-xl font-black text-slate-800 dark:text-white font-mono" />
                        <p className="text-[8px] text-slate-400 px-2 italic">Costo variable por volumen cosechado.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-2">
                            <Tags className="w-4 h-4 text-indigo-500" /> Calidad (Factor Rend.)
                        </label>
                        <input type="number" value={qualityFactor} onChange={e => setQualityFactor(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border-none rounded-2xl p-4 text-xl font-black text-slate-800 dark:text-white font-mono" />
                        <p className="text-[8px] text-slate-400 px-2 italic">Ajusta el precio: Base 94. A mayor factor, menor precio.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-2">
                            <History className="w-4 h-4 text-emerald-500" /> Fondo Renovación (%)
                        </label>
                        <input type="number" value={reservePercent} onChange={e => setReservePercent(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border-none rounded-2xl p-4 text-xl font-black text-slate-800 dark:text-white font-mono" />
                        <p className="text-[8px] text-slate-400 px-2 italic">Provisión anual para financiar la zoca/renovación.</p>
                    </div>
                </div>
            </div>

            {/* --- NAVEGACIÓN --- */}
            <div className="flex bg-slate-200 dark:bg-slate-900 p-1.5 rounded-[2rem] gap-1 shadow-inner border dark:border-slate-800">
                {[
                    { id: 'PROJECTION', label: 'Flujos Netos (Realistas)', icon: Trend },
                    { id: 'INVESTMENT', label: 'Matriz CAPEX', icon: Coins },
                    { id: 'STRESS', label: 'Laboratorio de Riesgo', icon: Flame }
                ].map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-3 transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-800 text-slate-900 shadow-xl border border-slate-200 dark:border-slate-700' : 'text-slate-500'}`}
                    >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'PROJECTION' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><GraduationCap className="w-5 h-5 text-indigo-500" /> Configuración Biológica</h4>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase ml-2 mb-2 block">Variedad</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(VARIETY_CONFIG).map(([key, cfg]) => (
                                            <button key={key} onClick={() => setVariety(key as any)} className={`p-3 rounded-xl text-[9px] font-black uppercase border transition-all ${variety === key ? 'bg-slate-900 text-emerald-400 border-slate-800 shadow-lg' : 'bg-slate-50 dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800'}`}>{cfg.label}</button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase ml-2 mb-2 block">Tecnificación</label>
                                    <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl">
                                        {(Object.keys(TECH_CONFIG) as TechLevel[]).map(lvl => (
                                            <button key={lvl} onClick={() => setTechLevel(lvl)} className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase transition-all ${techLevel === lvl ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-md border border-slate-200 dark:border-slate-700' : 'text-slate-500'}`}>{TECH_CONFIG[lvl].label}</button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase ml-2 mb-1 block">Número de Árboles</label>
                                    <input type="text" value={formatNumberInput(numTrees)} onChange={e => setNumTrees(parseNumberInput(e.target.value).toString())} className="w-full bg-slate-100 dark:bg-slate-950 border-none rounded-xl p-4 text-xl font-black text-slate-800 dark:text-white font-mono" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-[3.5rem] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                            <h3 className="text-slate-800 dark:text-white font-black text-xs uppercase flex items-center gap-3 tracking-[0.3em] mb-8"><Trend className="w-5 h-5 text-emerald-500" /> Flujo de Caja Maestro</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {simulation.yearlyData.map(y => {
                                    const isProfit = y.netCashFlow >= 0;
                                    return (
                                        <div key={y.year} className={`p-6 rounded-[2.5rem] border transition-all ${y.year === simulation.paybackYear ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500/20 shadow-lg' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Año {y.year}</span>
                                                {y.year === simulation.paybackYear && <span className="text-[8px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-black uppercase flex items-center gap-1"><Timer className="w-3 h-3"/> Retorno Capital</span>}
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center"><span className="text-[10px] text-slate-500 font-bold uppercase">Prod. Estimada</span><span className="text-[11px] font-black text-slate-700 dark:text-slate-300">{Math.round(y.totalProductionKg).toLocaleString()} Kg CPS</span></div>
                                                <div className="flex justify-between items-center"><span className="text-[10px] text-slate-500 font-bold uppercase">Ingreso Bruto</span><span className="text-[11px] font-black text-emerald-600">{formatCurrency(y.totalIncome)}</span></div>
                                                <div className="flex justify-between items-center"><span className="text-[10px] text-amber-600 font-bold uppercase">Costo Recolección</span><span className="text-[11px] font-black text-amber-600">-{formatCurrency(y.harvestCost)}</span></div>
                                                <div className="flex justify-between items-center"><span className="text-[10px] text-indigo-400 font-bold uppercase">Fondo Renovación</span><span className="text-[11px] font-black text-indigo-400">-{formatCurrency(y.renovationReserve)}</span></div>
                                                <div className="flex justify-between items-center"><span className="text-[10px] text-red-500 font-bold uppercase">Sostenimiento+Deuda</span><span className="text-[11px] font-black text-red-500">-{formatCurrency(y.capex + y.opex + y.debtService)}</span></div>
                                            </div>
                                            <div className="h-px bg-slate-200 dark:bg-slate-800 my-4" />
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase">Utilidad Neta</span>
                                                <span className={`text-lg font-black font-mono ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>{isProfit ? '+' : ''}{formatCurrency(y.netCashFlow)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'INVESTMENT' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-900 p-8 rounded-[3rem] border border-slate-800 shadow-xl flex flex-col justify-center items-center text-center">
                            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-500 mb-4 border border-slate-700">
                                <Wallet className="w-8 h-8" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inversión de Establecimiento</p>
                            <p className="text-3xl font-black text-white font-mono">{formatCurrency(simulation.totalCapex)}</p>
                            <p className="text-[9px] text-slate-500 mt-2 italic">Capital requerido para los años 1 y 2 (Levante).</p>
                        </div>
                        
                        <div className="md:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-xl">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Layers className="w-5 h-5 text-indigo-500" /> Distribución Estratégica del Capital</h4>
                            <div className="space-y-4">
                                {[
                                    { label: 'Germinador y Semilla Pro', percent: 15, color: 'bg-emerald-500' },
                                    { label: 'Adecuación de Terreno y Enmiendas', percent: 25, color: 'bg-amber-500' },
                                    { label: 'Nutrición de Levante (Etapa Crítica)', percent: 35, color: 'bg-indigo-500' },
                                    { label: 'Administración y Mano de Obra', percent: 25, color: 'bg-blue-500' }
                                ].map((item, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500 mb-1">
                                            <span>{item.label}</span>
                                            <span className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(simulation.totalCapex * (item.percent / 100))}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                            <div className={`h-full ${item.color}`} style={{width: `${item.percent}%`}}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'STRESS' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-slate-900 p-10 rounded-[3.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><Flame className="w-48 h-48 text-red-500" /></div>
                        <div className="relative z-10 text-center max-w-2xl mx-auto space-y-6">
                            <h3 className="text-white font-black text-2xl uppercase tracking-tighter">Pruebas de Estrés Agronómico</h3>
                            <p className="text-sm text-slate-400 font-medium leading-relaxed">
                                Evalúe la supervivencia financiera ante variables externas incontrolables. Un modelo exitoso debe resistir al menos un escenario de crisis de precios o clima.
                            </p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                                {[
                                    { id: 'NONE', label: 'Escenario Base', icon: ShieldCheck, color: 'bg-slate-800', sub: 'Normalidad' },
                                    { id: 'NINO', label: 'Fenómeno Niño', icon: CloudRain, color: 'bg-orange-950 border-orange-500/30', sub: 'Menos Volumen + Castigo Factor' },
                                    { id: 'PRICE_CRISIS', label: 'Crisis Precios', icon: TrendingDown, color: 'bg-red-950 border-red-500/30', sub: '-30% Mercado' },
                                    { id: 'BONANZA', label: 'Bonanza Export', icon: Gem, color: 'bg-emerald-950 border-emerald-500/30', sub: '+40% Precio Premium' }
                                ].map(evt => (
                                    <button 
                                        key={evt.id} 
                                        onClick={() => setActiveCrisis(evt.id as any)}
                                        className={`p-6 rounded-[2.5rem] border flex flex-col items-center gap-3 transition-all active:scale-95 ${activeCrisis === evt.id ? `bg-slate-100 text-slate-900 border-white shadow-2xl scale-105` : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                                    >
                                        <evt.icon className={`w-8 h-8 ${activeCrisis === evt.id ? 'text-indigo-600' : 'text-slate-600'}`} />
                                        <div>
                                            <p className={`text-[10px] font-black uppercase ${activeCrisis === evt.id ? 'text-slate-900' : 'text-slate-400'}`}>{evt.label}</p>
                                            <p className={`text-[8px] font-bold uppercase ${activeCrisis === evt.id ? 'text-slate-600' : 'text-slate-600'}`}>{evt.sub}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[3.5rem] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden relative">
                         <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Microscope className="w-5 h-5 text-emerald-500" /> Diagnóstico de Estabilidad</h4>
                         <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-1 space-y-4">
                                <div className={`p-6 rounded-[2rem] border transition-all ${simulation.isHealthy ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500/20' : 'bg-red-50 dark:bg-red-900/10 border-red-500/20'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-[10px] font-black text-slate-500 uppercase">Resiliencia del Flujo</p>
                                        {simulation.isHealthy ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-red-500" />}
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                                        {simulation.isHealthy 
                                            ? "El modelo resiste la crisis. La estructura de reserva (Fondo de Renovación) y los costos controlados permiten absorber el impacto sin entrar en insolvencia." 
                                            : "INVIABILIDAD DETECTADA. El costo de recolección y la caída en calidad destruyen el margen. Se requiere tecnificar para subir productividad por encima de 18 cargas/Ha."}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-slate-950 p-6 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center w-40 h-40 shadow-inner">
                                <p className="text-[8px] font-black text-slate-500 uppercase">Supervivencia</p>
                                <p className={`text-3xl font-black ${simulation.isHealthy ? 'text-emerald-500' : 'text-red-500'}`}>{simulation.isHealthy ? 'ALTA' : 'CRÍTICA'}</p>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Score Técnico</p>
                            </div>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};
