
import React, { useState, useMemo } from 'react';
import { Machine, MaintenanceLog, RainLog, CostCenter, Personnel, Activity, SoilAnalysis, PPELog, WasteLog, Asset, BpaCriterion, PhenologyLog, PestLog } from '../types';
import { formatCurrency, generateId } from '../services/inventoryService';
import { Settings, Wrench, Droplets, Plus, Trash2, Fuel, PenTool, FileText, FileSpreadsheet, Download, Gauge, User, MapPin, Pickaxe, DollarSign, CheckCircle, ArrowRight, Tractor, Microscope, ShieldCheck, Recycle, Signature, UserCheck, ShieldAlert, FileCheck, Pencil, Globe, ClipboardList, Briefcase, Droplet, AlertTriangle, Bookmark, Shield, Zap, Info, Clock, CheckCircle2, Leaf, Bug, FlaskConical, Scale, Warehouse, HardHat, ChevronDown, ChevronUp, AlertCircle, Award, Sprout, Coffee } from 'lucide-react';

interface ManagementViewProps {
  machines: Machine[];
  maintenanceLogs: MaintenanceLog[];
  rainLogs: RainLog[];
  costCenters: CostCenter[];
  personnel: Personnel[];
  activities: Activity[];
  soilAnalyses: SoilAnalysis[];
  ppeLogs: PPELog[];
  wasteLogs: WasteLog[];
  assets: Asset[];
  bpaChecklist: Record<string, boolean>;
  phenologyLogs: PhenologyLog[];
  pestLogs: PestLog[];
  onAddMachine: (m: Omit<Machine, 'id' | 'warehouseId'>) => void;
  onUpdateMachine: (machine: Machine) => void;
  onAddMaintenance: (m: Omit<MaintenanceLog, 'id' | 'warehouseId'>) => void;
  onDeleteMachine: (id: string) => void;
  onAddRain: (r: Omit<RainLog, 'id' | 'warehouseId'>) => void;
  onDeleteRain: (id: string) => void;
  onAddSoilAnalysis: (s: Omit<SoilAnalysis, 'id' | 'warehouseId'>) => void;
  onDeleteSoilAnalysis: (id: string) => void;
  onAddPPE: (p: Omit<PPELog, 'id' | 'warehouseId'>) => void;
  onDeletePPE: (id: string) => void;
  onAddWaste: (w: Omit<WasteLog, 'id' | 'warehouseId'>) => void;
  onDeleteWaste: (id: string) => void;
  onAddAsset: (a: Omit<Asset, 'id' | 'warehouseId'>) => void;
  onDeleteAsset: (id: string) => void;
  onToggleBpa: (code: string) => void;
  onAddPhenologyLog: (log: Omit<PhenologyLog, 'id' | 'warehouseId'>) => void;
  onDeletePhenologyLog: (id: string) => void;
  onAddPestLog: (log: Omit<PestLog, 'id' | 'warehouseId'>) => void;
  onDeletePestLog: (id: string) => void;
  isAdmin: boolean;
}

// --- PLANTILLA PROFESIONAL ICA (Res. 30021 / 082394) ---
const ICA_TEMPLATE: BpaCriterion[] = [
  // I. ÁREAS E INSTALACIONES
  { id: 'I.1', standard: 'ICA', category: '1. Áreas e Instalaciones', code: '1.1', label: 'Unidad sanitaria (baño) disponible, limpia, dotada (papel, jabón, toallas) y conectada a pozo séptico o alcantarillado.', complianceLevel: 'MAJOR', compliant: false },
  { id: 'I.2', standard: 'ICA', category: '1. Áreas e Instalaciones', code: '1.2', label: 'Área de almacenamiento de insumos agrícolas (Bodega) independiente de vivienda, seca, ventilada y con piso impermeable.', complianceLevel: 'MAJOR', compliant: false },
  { id: 'I.3', standard: 'ICA', category: '1. Áreas e Instalaciones', code: '1.3', label: 'Estanterías de material incombustible y no absorbente (No madera). Separación física de Fertilizantes y Plaguicidas.', complianceLevel: 'MAJOR', compliant: false },
  { id: 'I.4', standard: 'ICA', category: '1. Áreas e Instalaciones', code: '1.4', label: 'Kit de control de derrames visible en bodega (Arena/Aserrín, Escoba, Recogedor, Bolsa Roja).', complianceLevel: 'MAJOR', compliant: false },
  { id: 'I.5', standard: 'ICA', category: '1. Áreas e Instalaciones', code: '1.5', label: 'Área de dosificación y mezcla de plaguicidas con piso impermeable y drenaje dirigido.', complianceLevel: 'MINOR', compliant: false },
  { id: 'I.6', standard: 'ICA', category: '1. Áreas e Instalaciones', code: '1.6', label: 'Área de acopio transitorio de cosecha (techada, limpia, estibas plásticas/madera limpia).', complianceLevel: 'MAJOR', compliant: false },
  { id: 'I.7', standard: 'ICA', category: '1. Áreas e Instalaciones', code: '1.7', label: 'Área de consumo de alimentos y descanso para trabajadores (separada de cultivos y bodegas).', complianceLevel: 'MINOR', compliant: false },
  
  // II. EQUIPOS, UTENSILIOS Y HERRAMIENTAS
  { id: 'II.1', standard: 'ICA', category: '2. Equipos y Herramientas', code: '2.1', label: 'Equipos de aplicación (bombas) en buen estado, sin fugas y calibrados (Registro de calibración).', complianceLevel: 'MAJOR', compliant: false },
  { id: 'II.2', standard: 'ICA', category: '2. Equipos y Herramientas', code: '2.2', label: 'Herramientas de cosecha (tijeras, canastillas) limpias, desinfectadas y en buen estado.', complianceLevel: 'MAJOR', compliant: false },
  
  // III. PERSONAL (SST)
  { id: 'III.1', standard: 'ICA', category: '3. Personal y SST', code: '3.1', label: 'Uso de Elementos de Protección Personal (EPP) completo según labor (aplicación vs cosecha).', complianceLevel: 'MAJOR', compliant: false },
  { id: 'III.2', standard: 'ICA', category: '3. Personal y SST', code: '3.2', label: 'Exámenes médicos ocupacionales (Colinesterasa para aplicadores) vigentes.', complianceLevel: 'MAJOR', compliant: false },
  { id: 'III.3', standard: 'ICA', category: '3. Personal y SST', code: '3.3', label: 'Capacitación documentada en: Manejo de Agroquímicos, Primeros Auxilios y Higiene.', complianceLevel: 'MINOR', compliant: false },
  { id: 'III.4', standard: 'ICA', category: '3. Personal y SST', code: '3.4', label: 'Botiquín de primeros auxilios dotado, accesible y señalizado.', complianceLevel: 'MINOR', compliant: false },
  { id: 'III.5', standard: 'ICA', category: '3. Personal y SST', code: '3.5', label: 'Extintor multipropósito vigente, carga visible y ubicado en zona de riesgo (Bodega).', complianceLevel: 'MAJOR', compliant: false },

  // IV. MANEJO DEL CULTIVO (MIP + SUELOS)
  { id: 'IV.1', standard: 'ICA', category: '4. Manejo de Cultivo', code: '4.1', label: 'Uso de semilla certificada o material de propagación con registro ICA (Facturas/Soportes).', complianceLevel: 'MAJOR', compliant: false },
  { id: 'IV.2', standard: 'ICA', category: '4. Manejo de Cultivo', code: '4.2', label: 'Análisis de Suelo reciente (< 2 años) y Plan de Fertilización firmado por Ingeniero Agrónomo.', complianceLevel: 'MAJOR', compliant: false },
  { id: 'IV.3', standard: 'ICA', category: '4. Manejo de Cultivo', code: '4.3', label: 'Plan de Manejo Integrado de Plagas (MIP) documentado y monitoreos escritos.', complianceLevel: 'MAJOR', compliant: false },
  { id: 'IV.4', standard: 'ICA', category: '4. Manejo de Cultivo', code: '4.4', label: 'Solo se usan plaguicidas con Registro ICA para el cultivo específico (Revisión etiqueta).', complianceLevel: 'MAJOR', compliant: false },
  { id: 'IV.5', standard: 'ICA', category: '4. Manejo de Cultivo', code: '4.5', label: 'Respeto estricto a los Periodos de Carencia (PC) y Reentrada (PR) registrados en campo.', complianceLevel: 'MAJOR', compliant: false },
  
  // V. GESTIÓN AMBIENTAL
  { id: 'V.1', standard: 'ICA', category: '5. Gestión Ambiental', code: '5.1', label: 'Análisis de agua (Físico-químico y Microbiológico) con vigencia menor a 1 año.', complianceLevel: 'MAJOR', compliant: false },
  { id: 'V.2', standard: 'ICA', category: '5. Gestión Ambiental', code: '5.2', label: 'Manejo de envases vacíos: Triple Lavado, perforado y entrega a centro de acopio (Certificado Campo Limpio).', complianceLevel: 'MAJOR', compliant: false },
  { id: 'V.3', standard: 'ICA', category: '5. Gestión Ambiental', code: '5.3', label: 'No hay quemas a cielo abierto ni disposición de basuras en el cultivo.', complianceLevel: 'MINOR', compliant: false },

  // VI. TRAZABILIDAD
  { id: 'VI.1', standard: 'ICA', category: '6. Documentación', code: '6.1', label: 'Plan de Trazabilidad: Capacidad de rastrear el producto desde el lote hasta el cliente.', complianceLevel: 'MAJOR', compliant: false },
  { id: 'VI.2', standard: 'ICA', category: '6. Documentación', code: '6.2', label: 'Registros de todas las labores al día (Kárdex, Aplicaciones, Cosechas, Ventas).', complianceLevel: 'MAJOR', compliant: false },
  { id: 'VI.3', standard: 'ICA', category: '6. Documentación', code: '6.3', label: 'Asistencia técnica: Informes de visita de Asistente Técnico / Agrónomo.', complianceLevel: 'MINOR', compliant: false },
];

// --- PLANTILLA GLOBALG.A.P. IFA v6 (Based on 2025 Manual CCOF - Major Musts Focus) ---
const GLOBALGAP_TEMPLATE: BpaCriterion[] = [
    // AF: All Farm Base - GESTIÓN
    { id: 'GG.AF.1', standard: 'GLOBALGAP', category: 'AF - Gestión y Registro', code: 'AF 1.2.1', label: 'El productor tiene un sistema de registro y auto-evaluación completo.', complianceLevel: 'MAJOR', compliant: false },
    { id: 'GG.AF.2', standard: 'GLOBALGAP', category: 'AF - Gestión y Registro', code: 'AF 2.1.1', label: 'Historial del sitio y gestión del sitio: Evaluación de Riesgos documentada.', complianceLevel: 'MAJOR', compliant: false },
    { id: 'GG.AF.3', standard: 'GLOBALGAP', category: 'AF - Gestión y Registro', code: 'AF 3.1.1', label: 'Higiene: Evaluación de riesgos de higiene (física, química, biológica) implementada.', complianceLevel: 'MAJOR', compliant: false },
    { id: 'GG.AF.4', standard: 'GLOBALGAP', category: 'AF - Gestión y Registro', code: 'AF 4.1.1', label: 'Salud y Seguridad (SST): Evaluación de riesgos laborales escrita y comunicada.', complianceLevel: 'MAJOR', compliant: false },
    { id: 'GG.AF.5', standard: 'GLOBALGAP', category: 'AF - Gestión y Registro', code: 'AF 4.1.2', label: 'SST: Entrenamiento documentado en manejo de químicos, equipos y primeros auxilios.', complianceLevel: 'MAJOR', compliant: false },
    { id: 'GG.AF.6', standard: 'GLOBALGAP', category: 'AF - Gestión y Registro', code: 'AF 6.2.1', label: 'Gestión de Residuos: Identificación, separación y no quema de residuos.', complianceLevel: 'MAJOR', compliant: false },
    { id: 'GG.AF.7', standard: 'GLOBALGAP', category: 'AF - Gestión y Registro', code: 'AF 13.1', label: 'Trazabilidad: Identificación clara del producto final y segregación (Mass Balance).', complianceLevel: 'MAJOR', compliant: false },
    { id: 'GG.AF.8', standard: 'GLOBALGAP', category: 'AF - Gestión y Registro', code: 'AF 14.1', label: 'Balance de Masas: Los insumos y productos vendidos cuadran con la producción estimada.', complianceLevel: 'MAJOR', compliant: false },
    { id: 'GG.AF.9', standard: 'GLOBALGAP', category: 'AF - Gestión y Registro', code: 'AF 16.1', label: 'Fraude Alimentario: Evaluación de vulnerabilidad ante fraude alimentario.', complianceLevel: 'MINOR', compliant: false },
    { id: 'GG.AF.10', standard: 'GLOBALGAP', category: 'AF - Gestión y Registro', code: 'AF 17.1', label: 'Especificaciones: Existen especificaciones claras para los insumos comprados.', complianceLevel: 'MINOR', compliant: false },

    // CB: Crops Base - CULTIVO
    { id: 'GG.CB.1', standard: 'GLOBALGAP', category: 'CB - Cultivo y Campo', code: 'CB 2.1.1', label: 'Material de Propagación: Certificados de calidad y sanidad vegetal disponibles.', complianceLevel: 'MAJOR', compliant: false },
    { id: 'GG.CB.2', standard: 'GLOBALGAP', category: 'CB - Cultivo y Campo', code: 'CB 2.3.1', label: 'OGM: Si se usan, cumplir con legislación local y notificar al cliente.', complianceLevel: 'MAJOR', compliant: false },
    { id: 'GG.CB.3', standard: 'GLOBALGAP', category: 'CB - Cultivo y Campo', code: 'CB 4.1.1', label: 'Gestión del Suelo: Mapeo de suelos y estrategias para evitar erosión/compactación.', complianceLevel: 'MINOR', compliant: false },
    { id: 'GG.CB.4', standard: 'GLOBALGAP', category: 'CB - Cultivo y Campo', code: 'CB 5.2.1', label: 'Fertilización: Inventario de fertilizantes separado y actualizado.', complianceLevel: 'MINOR', compliant: false },
    { id: 'GG.CB.5', standard: 'GLOBALGAP', category: 'CB - Cultivo y Campo', code: 'CB 5.2.2', label: 'Fertilización: Registro detallado de aplicaciones (Lote, Producto, Cantidad, Fecha).', complianceLevel: 'MAJOR', compliant: false },
    { id: 'GG.CB.6', standard: 'GLOBALGAP', category: 'CB - Cultivo y Campo', code: 'CB 7.1.1', label: 'MIP: Uso de monitoreo y umbrales antes de aplicar químicos (Justificación).', complianceLevel: 'MAJOR', compliant: false },
    { id: 'GG.CB.7', standard: 'GLOBALGAP', category: 'CB - Cultivo y Campo', code: 'CB 7.3.1', label: 'PPP: Lista de productos fitosanitarios aprobados para el cultivo objetivo.', complianceLevel: 'MAJOR', compliant: false },
    { id: 'GG.CB.8', standard: 'GLOBALGAP', category: 'CB - Cultivo y Campo', code: 'CB 7.3.5', label: 'PPP: El Intervalo de Pre-Cosecha (PHI) se respeta estrictamente.', complianceLevel: 'MAJOR', compliant: false },
    { id: 'GG.CB.9', standard: 'GLOBALGAP', category: 'CB - Cultivo y Campo', code: 'CB 7.3.6', label: 'PPP: Registros de aplicación completos (Lote, Dosis, Fecha, Operario, Motivo).', complianceLevel: 'MAJOR', compliant: false },
    { id: 'GG.CB.10', standard: 'GLOBALGAP', category: 'CB - Cultivo y Campo', code: 'CB 7.6.1', label: 'Residuos: Análisis de LMR (Límites Máximos de Residuos) realizado anualmente.', complianceLevel: 'MAJOR', compliant: false },
    { id: 'GG.CB.11', standard: 'GLOBALGAP', category: 'CB - Cultivo y Campo', code: 'CB 8.1.1', label: 'Equipos: Calibración verificada de equipos de aplicación de fertilizantes/químicos.', complianceLevel: 'MINOR', compliant: false },
    { id: 'GG.CB.12', standard: 'GLOBALGAP', category: 'CB - Cultivo y Campo', code: 'CB 9.1', label: 'Agua: Evaluación de riesgos de fuentes de agua para riego.', complianceLevel: 'MINOR', compliant: false },

    // FV: Fruit & Vegetables - COSECHA
    { id: 'GG.FV.1', standard: 'GLOBALGAP', category: 'FV - Cosecha y Manipulación', code: 'FV 1.1.1', label: 'Pre-Cosecha: Evaluación de riesgos de higiene pre-cosecha realizada.', complianceLevel: 'MAJOR', compliant: false },
    { id: 'GG.FV.2', standard: 'GLOBALGAP', category: 'FV - Cosecha y Manipulación', code: 'FV 4.1.1', label: 'Higiene Personal: Instalaciones sanitarias y lavado de manos disponibles en campo (<500m).', complianceLevel: 'MAJOR', compliant: false },
    { id: 'GG.FV.3', standard: 'GLOBALGAP', category: 'FV - Cosecha y Manipulación', code: 'FV 5.1.1', label: 'Calidad del Agua: El agua utilizada en pos-cosecha/lavado es potable.', complianceLevel: 'MAJOR', compliant: false },
    { id: 'GG.FV.4', standard: 'GLOBALGAP', category: 'FV - Cosecha y Manipulación', code: 'FV 5.2.2', label: 'Empaque: Control de rotura de vidrio y plásticos duros en zona de empaque.', complianceLevel: 'MAJOR', compliant: false },
    { id: 'GG.FV.5', standard: 'GLOBALGAP', category: 'FV - Cosecha y Manipulación', code: 'FV 5.8.1', label: 'Etiquetado: El producto final está correctamente identificado según norma.', complianceLevel: 'MAJOR', compliant: false },
    { id: 'GG.FV.6', standard: 'GLOBALGAP', category: 'FV - Cosecha y Manipulación', code: 'FV 5.4.1', label: 'Control de Plagas: Sistema de control de plagas efectivo en áreas de empaque.', complianceLevel: 'MAJOR', compliant: false },
];

// --- 4C CODE OF CONDUCT v4.1 (2025) ---
// Compliance Level 1 (Entry) = MAJOR
// Compliance Level 2/3 (Continuous) = MINOR
const CODE_4C_TEMPLATE: BpaCriterion[] = [
    // DIM 1: ECONOMIC
    { id: '4C.1.1.1', standard: 'CODE_4C', category: '1. Dimensión Económica', code: '1.1.1', label: 'Sistema de gestión implementado y compromiso con requisitos 4C.', complianceLevel: 'MAJOR', compliant: false },
    { id: '4C.1.1.2', standard: 'CODE_4C', category: '1. Dimensión Económica', code: '1.1.2', label: 'No participación en soborno, fraude, corrupción o extorsión.', complianceLevel: 'MAJOR', compliant: false },
    { id: '4C.1.1.3', standard: 'CODE_4C', category: '1. Dimensión Económica', code: '1.1.3', label: 'Cumplimiento de todas las leyes nacionales y regionales aplicables.', complianceLevel: 'MAJOR', compliant: false },
    { id: '4C.1.4.1', standard: 'CODE_4C', category: '1. Dimensión Económica', code: '1.4.1', label: 'Trazabilidad: Café 4C físicamente segregado y documentado.', complianceLevel: 'MAJOR', compliant: false },
    { id: '4C.1.3.1', standard: 'CODE_4C', category: '1. Dimensión Económica', code: '1.3.1', label: 'Acceso a asistencia técnica sobre Buenas Prácticas Agrícolas (BPA).', complianceLevel: 'MINOR', compliant: false },
    { id: '4C.1.1.5', standard: 'CODE_4C', category: '1. Dimensión Económica', code: '1.1.5', label: 'Registros de producción y costos para evaluar rentabilidad.', complianceLevel: 'MAJOR', compliant: false },

    // DIM 2: SOCIAL
    { id: '4C.2.1.1', standard: 'CODE_4C', category: '2. Dimensión Social', code: '2.1.1', label: 'No existen prácticas de desalojo forzoso.', complianceLevel: 'MAJOR', compliant: false },
    { id: '4C.2.1.2', standard: 'CODE_4C', category: '2. Dimensión Social', code: '2.1.2', label: 'Prohibición total de trabajo forzoso o en servidumbre.', complianceLevel: 'MAJOR', compliant: false },
    { id: '4C.2.1.3', standard: 'CODE_4C', category: '2. Dimensión Social', code: '2.1.3', label: 'Prohibición total de trabajo infantil (menores de 15 años).', complianceLevel: 'MAJOR', compliant: false },
    { id: '4C.2.1.4', standard: 'CODE_4C', category: '2. Dimensión Social', code: '2.1.4', label: 'Libertad de asociación y negociación colectiva garantizada.', complianceLevel: 'MAJOR', compliant: false },
    { id: '4C.2.1.6', standard: 'CODE_4C', category: '2. Dimensión Social', code: '2.1.6', label: 'No discriminación (raza, género, religión, política).', complianceLevel: 'MAJOR', compliant: false },
    { id: '4C.2.1.11', standard: 'CODE_4C', category: '2. Dimensión Social', code: '2.1.11', label: 'Pago de al menos el salario mínimo legal a todos los trabajadores.', complianceLevel: 'MAJOR', compliant: false },
    { id: '4C.2.2.1', standard: 'CODE_4C', category: '2. Dimensión Social', code: '2.2.1', label: 'Vivienda adecuada para trabajadores (si aplica).', complianceLevel: 'MAJOR', compliant: false },
    { id: '4C.2.2.2', standard: 'CODE_4C', category: '2. Dimensión Social', code: '2.2.2', label: 'Instalaciones sanitarias y de lavado de manos disponibles.', complianceLevel: 'MAJOR', compliant: false },
    { id: '4C.2.2.3', standard: 'CODE_4C', category: '2. Dimensión Social', code: '2.2.3', label: 'Acceso a agua potable para todos los trabajadores.', complianceLevel: 'MAJOR', compliant: false },
    { id: '4C.2.2.5', standard: 'CODE_4C', category: '2. Dimensión Social', code: '2.2.5', label: 'Suministro de Equipos de Protección Personal (EPP) adecuados.', complianceLevel: 'MAJOR', compliant: false },

    // DIM 3: ENVIRONMENTAL
    { id: '4C.3.1.1', standard: 'CODE_4C', category: '3. Dimensión Ambiental', code: '3.1.1', label: 'Prohibición de deforestación de bosques primarios o áreas protegidas (post-2006).', complianceLevel: 'MAJOR', compliant: false },
    { id: '4C.3.1.3', standard: 'CODE_4C', category: '3. Dimensión Ambiental', code: '3.1.3', label: 'No uso de Organismos Genéticamente Modificados (OGM).', complianceLevel: 'MAJOR', compliant: false },
    { id: '4C.3.2.1', standard: 'CODE_4C', category: '3. Dimensión Ambiental', code: '3.2.1', label: 'No uso de pesticidas prohibidos (Lista Roja 4C).', complianceLevel: 'MAJOR', compliant: false },
    { id: '4C.3.2.3', standard: 'CODE_4C', category: '3. Dimensión Ambiental', code: '3.2.3', label: 'Manejo seguro de pesticidas y disposición de envases vacíos.', complianceLevel: 'MAJOR', compliant: false },
    { id: '4C.3.3.1', standard: 'CODE_4C', category: '3. Dimensión Ambiental', code: '3.3.1', label: 'Implementación de prácticas de conservación de suelos.', complianceLevel: 'MAJOR', compliant: false },
    { id: '4C.3.4.1', standard: 'CODE_4C', category: '3. Dimensión Ambiental', code: '3.4.1', label: 'Conservación de fuentes de agua.', complianceLevel: 'MAJOR', compliant: false },
    { id: '4C.3.4.4', standard: 'CODE_4C', category: '3. Dimensión Ambiental', code: '3.4.4', label: 'No vertimiento directo de aguas residuales (Mieles) a fuentes de agua.', complianceLevel: 'MAJOR', compliant: false },
    { id: '4C.3.5.1', standard: 'CODE_4C', category: '3. Dimensión Ambiental', code: '3.5.1', label: 'Gestión segura de residuos (no quema, no vertederos ilegales).', complianceLevel: 'MAJOR', compliant: false },
];

export const ManagementView: React.FC<ManagementViewProps> = ({
    machines, maintenanceLogs, rainLogs, costCenters, personnel, activities,
    soilAnalyses, ppeLogs, wasteLogs, assets, bpaChecklist, phenologyLogs, pestLogs,
    onAddMachine, onUpdateMachine, onAddMaintenance, onDeleteMachine,
    onAddRain, onDeleteRain,
    onAddSoilAnalysis, onDeleteSoilAnalysis,
    onAddPPE, onDeletePPE,
    onAddWaste, onDeleteWaste,
    onAddAsset, onDeleteAsset, onToggleBpa,
    onAddPhenologyLog, onDeletePhenologyLog,
    onAddPestLog, onDeletePestLog,
    isAdmin
}) => {
  const [subTab, setSubTab] = useState<'audit' | 'assets' | 'agronomy' | 'sst' | 'tools'>('audit');
  const [auditStandard, setAuditStandard] = useState<'ICA' | 'GLOBALGAP' | 'CODE_4C'>('ICA');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Forms State
  const [assetName, setAssetName] = useState('');
  const [assetPrice, setAssetPrice] = useState('');
  const [assetLife, setAssetLife] = useState('10');
  const [assetCat, setAssetCat] = useState<'MAQUINARIA' | 'HERRAMIENTA' | 'INFRAESTRUCTURA'>('MAQUINARIA');

  const [maintMachineId, setMaintMachineId] = useState('');
  const [maintCost, setMaintCost] = useState('');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintHours, setMaintHours] = useState('');
  const [maintFuel, setMaintFuel] = useState('');

  const [rainMm, setRainMm] = useState('');
  const [phenoLotId, setPhenoLotId] = useState('');
  const [phenoStage, setPhenoStage] = useState<'Floración' | 'Cuajado' | 'Llenado' | 'Maduración'>('Floración');
  const [pestLotId, setPestLotId] = useState('');
  const [pestName, setPestName] = useState('');
  const [pestIncidence, setPestIncidence] = useState<'Baja' | 'Media' | 'Alta'>('Baja');

  // SST Forms State
  const [ppePersonnelId, setPpePersonnelId] = useState('');
  const [ppeItems, setPpeItems] = useState('');
  const [wasteDescription, setWasteDescription] = useState('');
  const [wasteQty, setWasteQty] = useState('');
  const [wasteTripleWashed, setWasteTripleWashed] = useState(true);

  // Tools State
  const [toolMachineId, setToolMachineId] = useState('');
  const [toolDischarge, setToolDischarge] = useState('');
  const [toolDischargeUnit, setToolDischargeUnit] = useState<'L' | 'ml' | 'cc'>('L'); 
  const [toolWidth, setToolWidth] = useState('');
  const [toolSpeed, setToolSpeed] = useState('');
  const [toolTank, setToolTank] = useState('');
  const [toolDose, setToolDose] = useState('');
  const [toolDoseUnit, setToolDoseUnit] = useState<'L' | 'ml' | 'cc' | 'Kg' | 'g'>('cc');


  const bpaSummary = useMemo(() => {
    // 1. Select Template
    let template: BpaCriterion[] = [];
    if (auditStandard === 'ICA') template = ICA_TEMPLATE;
    else if (auditStandard === 'GLOBALGAP') template = GLOBALGAP_TEMPLATE;
    else if (auditStandard === 'CODE_4C') template = CODE_4C_TEMPLATE;

    const criteria = template.map(c => ({ ...c, compliant: !!bpaChecklist[c.code] }));
    
    // 2. Logic Calculation
    const total = criteria.length;
    
    // ICA Logic: Single Score
    if (auditStandard === 'ICA') {
        const compliant = criteria.filter(c => c.compliant).length;
        const criticalFail = criteria.some(c => c.complianceLevel === 'MAJOR' && !c.compliant);
        // Grouping for ICA (Dynamic based on new categories)
        const grouped: Record<string, BpaCriterion[]> = {};
        criteria.forEach(c => {
            if (!grouped[c.category]) grouped[c.category] = [];
            grouped[c.category].push(c);
        });

        return { 
            criteria, 
            percent: (compliant / total) * 100, 
            criticalFail, 
            grouped,
            majorPercent: 0, 
            minorPercent: 0 
        };
    } else {
        // GLOBALG.A.P and 4C Logic: Dual Score
        const majorItems = criteria.filter(c => c.complianceLevel === 'MAJOR');
        const minorItems = criteria.filter(c => c.complianceLevel === 'MINOR' || c.complianceLevel === 'REC');
        
        const majorCompliant = majorItems.filter(c => c.compliant).length;
        const minorCompliant = minorItems.filter(c => c.compliant).length;
        
        const majorPercent = majorItems.length > 0 ? (majorCompliant / majorItems.length) * 100 : 100;
        const minorPercent = minorItems.length > 0 ? (minorCompliant / minorItems.length) * 100 : 100;
        
        // Pass Rule: 100% Major AND >= 95% Minor (Typically)
        const criticalFail = majorPercent < 100 || minorPercent < 95;

        // Grouping
        const grouped: Record<string, BpaCriterion[]> = {};
        criteria.forEach(c => {
            if (!grouped[c.category]) grouped[c.category] = [];
            grouped[c.category].push(c);
        });

        return {
            criteria,
            percent: (majorPercent + minorPercent) / 2, // Average for generic visual
            majorPercent,
            minorPercent,
            criticalFail,
            grouped
        };
    }
  }, [bpaChecklist, auditStandard]);

  const toolCalculations = useMemo(() => {
      let dischargeLmin = parseFloat(toolDischarge);
      if (toolDischargeUnit === 'ml' || toolDischargeUnit === 'cc') {
          dischargeLmin = dischargeLmin / 1000;
      }

      const width = parseFloat(toolWidth);
      const speed = parseFloat(toolSpeed);
      
      if (!dischargeLmin || !width || !speed) return { LHa: 0, productPerTank: 0 };
      
      const LHa = (dischargeLmin * 600) / (width * speed);
      
      const tank = parseFloat(toolTank);
      const dose = parseFloat(toolDose);
      
      let productPerTank = 0;
      if (LHa > 0 && tank > 0 && dose > 0) {
          productPerTank = (tank / LHa) * dose;
      }

      return { LHa, productPerTank };
  }, [toolDischarge, toolDischargeUnit, toolWidth, toolSpeed, toolTank, toolDose]);

  const handleAddRain = (e: React.FormEvent) => { e.preventDefault(); if(rainMm) { onAddRain({date: new Date().toISOString(), millimeters: parseFloat(rainMm)}); setRainMm(''); } };
  const handleAddPheno = (e: React.FormEvent) => { e.preventDefault(); if(phenoLotId) { onAddPhenologyLog({date: new Date().toISOString(), costCenterId: phenoLotId, stage: phenoStage}); setPhenoLotId(''); } };
  const handleAddPest = (e: React.FormEvent) => { e.preventDefault(); if(pestLotId && pestName) { onAddPestLog({date: new Date().toISOString(), costCenterId: pestLotId, pestOrDisease: pestName, incidence: pestIncidence}); setPestLotId(''); setPestName(''); } };
  const handleAddMaintenance = (e: React.FormEvent) => { e.preventDefault(); if(maintMachineId && maintDesc) { onAddMaintenance({date: new Date().toISOString(), machineId: maintMachineId, description: maintDesc, cost: parseFloat(maintCost) || 0, hoursWorked: parseFloat(maintHours) || undefined, fuelUsedLiters: parseFloat(maintFuel) || undefined }); setMaintMachineId(''); setMaintCost(''); setMaintDesc(''); setMaintHours(''); setMaintFuel(''); } };
  const handleAddAssetSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!assetName || !assetPrice) return; onAddAsset({ name: assetName, purchasePrice: parseFloat(assetPrice), lifespanYears: parseInt(assetLife), category: assetCat, purchaseDate: new Date().toISOString().split('T')[0] }); setAssetName(''); setAssetPrice(''); };
  
  const handleAddPPEsubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ppePersonnelId || !ppeItems) return;
    const person = personnel.find(p => p.id === ppePersonnelId);
    if (!person) return;
    onAddPPE({ date: new Date().toISOString(), personnelId: ppePersonnelId, personnelName: person.name, items: ppeItems.split(',').map(s => s.trim()) });
    setPpePersonnelId(''); setPpeItems('');
  };
  
  const handleAddWasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wasteDescription || !wasteQty) return;
    onAddWaste({ date: new Date().toISOString(), itemDescription: wasteDescription, quantity: parseFloat(wasteQty), tripleWashed: wasteTripleWashed });
    setWasteDescription(''); setWasteQty(''); setWasteTripleWashed(true);
  };

  const getCategoryIcon = (cat: string) => {
      if (cat.includes('Instalaciones') || cat.includes('AF')) return Warehouse;
      if (cat.includes('Equipos') || cat.includes('CB')) return Wrench;
      if (cat.includes('Personal') || cat.includes('SST') || cat.includes('Social')) return UserCheck;
      if (cat.includes('Cultivo') || cat.includes('FV')) return Sprout;
      if (cat.includes('Ambiental')) return Leaf;
      if (cat.includes('Documentación') || cat.includes('Gestión') || cat.includes('Económica')) return ClipboardList;
      return Info;
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto scrollbar-hide gap-1 sticky top-[120px] z-30 shadow-md">
            <button onClick={() => setSubTab('audit')} className={`shrink-0 px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${subTab === 'audit' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500'}`}><ShieldCheck className="w-3 h-3" /> Radar BPA</button>
            <button onClick={() => setSubTab('assets')} className={`shrink-0 px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${subTab === 'assets' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}><Briefcase className="w-3 h-3" /> Activos</button>
            <button onClick={() => setSubTab('agronomy')} className={`shrink-0 px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${subTab === 'agronomy' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}><Leaf className="w-3 h-3" /> Agronomía</button>
            <button onClick={() => setSubTab('sst')} className={`shrink-0 px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${subTab === 'sst' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500'}`}><Signature className="w-3 h-3" /> SST/Ambiental</button>
            <button onClick={() => setSubTab('tools')} className={`shrink-0 px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${subTab === 'tools' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500'}`}><Wrench className="w-3 h-3" /> Herramientas</button>
        </div>

        {subTab === 'audit' && (
            <div className="space-y-6 animate-fade-in">
                
                {/* STANDARD SELECTOR */}
                <div className="flex flex-wrap gap-2 justify-center bg-slate-900 p-2 rounded-2xl relative z-0">
                    <button 
                        onClick={() => { setAuditStandard('ICA'); setExpandedCategory(null); }}
                        className={`flex-1 py-3 px-4 min-w-[120px] rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 transition-all relative z-10 ${auditStandard === 'ICA' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        <ShieldCheck className="w-4 h-4" /> Res. ICA
                    </button>
                    <button 
                        onClick={() => { setAuditStandard('GLOBALGAP'); setExpandedCategory(null); }}
                        className={`flex-1 py-3 px-4 min-w-[120px] rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 transition-all relative z-10 ${auditStandard === 'GLOBALGAP' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        <Globe className="w-4 h-4" /> GLOBALG.A.P.
                    </button>
                    <button 
                        onClick={() => { setAuditStandard('CODE_4C'); setExpandedCategory(null); }}
                        className={`flex-1 py-3 px-4 min-w-[120px] rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 transition-all relative z-10 ${auditStandard === 'CODE_4C' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        <Coffee className="w-4 h-4" /> Código 4C
                    </button>
                </div>

                {/* RADAR CHART AND SUMMARY - ADAPTIVE */}
                <div className={`p-8 rounded-[3rem] border-4 transition-all relative overflow-hidden ${bpaSummary.criticalFail ? 'bg-slate-900 border-red-500/30' : 'bg-slate-900 border-emerald-500/30'}`}>
                    <div className="relative z-10 flex flex-col items-center">
                        <h3 className="font-black text-2xl flex items-center justify-center gap-3 uppercase tracking-tighter mb-6 text-white text-center leading-tight">
                            {auditStandard === 'ICA' ? <ShieldCheck className="w-8 h-8 text-white" /> : auditStandard === 'GLOBALGAP' ? <Globe className="w-8 h-8 text-emerald-400" /> : <Coffee className="w-8 h-8 text-orange-400" />}
                            {auditStandard === 'ICA' ? 'Certificación ICA' : auditStandard === 'GLOBALGAP' ? 'GLOBALG.A.P. IFA' : 'Código 4C v4.1'}
                        </h3>
                        
                        {auditStandard === 'ICA' ? (
                            // SINGLE GAUGE FOR ICA
                            <div className="relative w-48 h-48 mx-auto mb-6">
                                <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl">
                                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800" />
                                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={552} strokeDashoffset={552 - (552 * bpaSummary.percent / 100)} className={`transition-all duration-1000 ${bpaSummary.criticalFail ? 'text-red-500' : 'text-emerald-500'}`} strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-5xl font-black text-white">{bpaSummary.percent.toFixed(0)}%</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Cumplimiento</span>
                                </div>
                            </div>
                        ) : (
                            // DUAL BAR FOR GLOBALGAP AND 4C (MAJOR / MINOR)
                            <div className="w-full space-y-6 mb-6">
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-xs font-black text-red-400 uppercase flex items-center gap-2"><Award className="w-4 h-4"/> Obligaciones Mayores</span>
                                        <span className={`text-lg font-black font-mono ${bpaSummary.majorPercent < 100 ? 'text-red-500' : 'text-emerald-500'}`}>{bpaSummary.majorPercent.toFixed(0)}% <span className="text-[9px] text-slate-500">/ 100%</span></span>
                                    </div>
                                    <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full transition-all duration-1000 ${bpaSummary.majorPercent < 100 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{width: `${bpaSummary.majorPercent}%`}}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-xs font-black text-blue-400 uppercase flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Mejora Continua</span>
                                        <span className={`text-lg font-black font-mono ${bpaSummary.minorPercent < 95 ? 'text-amber-500' : 'text-emerald-500'}`}>{bpaSummary.minorPercent.toFixed(0)}% <span className="text-[9px] text-slate-500">/ 95%</span></span>
                                    </div>
                                    <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full transition-all duration-1000 ${bpaSummary.minorPercent < 95 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{width: `${bpaSummary.minorPercent}%`}}></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {bpaSummary.criticalFail ? (
                            <div className="bg-red-500/20 border border-red-500 text-red-200 px-6 py-3 rounded-2xl flex items-center gap-3 animate-pulse">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                                <div className="text-left">
                                    <p className="font-black text-xs uppercase">No Certificable</p>
                                    <p className="text-[10px]">Fallan Puntos Críticos / Umbrales</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-200 px-6 py-3 rounded-2xl flex items-center gap-3">
                                <CheckCircle className="w-6 h-6 text-emerald-500" />
                                <div className="text-left">
                                    <p className="font-black text-xs uppercase">Listo para Auditoría</p>
                                    <p className="text-[10px]">Umbrales de cumplimiento OK</p>
                                </div>
                            </div>
                        )}
                        <p className="text-[9px] text-slate-500 mt-4 uppercase font-bold tracking-widest text-center">
                            {auditStandard === 'ICA' ? 'Auditoría Oficial Res. ICA 082394 / 30021' : auditStandard === 'GLOBALGAP' ? 'Basado en GLOBALG.A.P. IFA v6 GFS/Smart' : 'Código de Conducta 4C v4.1 (2025)'}
                        </p>
                    </div>
                </div>

                {/* ACCORDION LIST */}
                <div className="space-y-4">
                    {Object.entries(bpaSummary.grouped).map(([catKey, items]) => {
                        const Icon = getCategoryIcon(catKey);
                        const isExpanded = expandedCategory === catKey;
                        const typedItems = items as BpaCriterion[];
                        
                        const compliantCount = typedItems.filter(i => i.compliant).length;
                        const totalCount = typedItems.length;
                        const progress = (compliantCount / totalCount) * 100;
                        const hasCriticalFail = typedItems.some(i => i.complianceLevel === 'MAJOR' && !i.compliant);

                        return (
                            <div key={catKey} className={`rounded-[2rem] border overflow-hidden transition-all duration-300 ${isExpanded ? 'bg-slate-900 border-slate-700 shadow-xl' : 'bg-slate-900/50 border-slate-800'}`}>
                                <button 
                                    onClick={() => setExpandedCategory(isExpanded ? null : catKey)}
                                    className="w-full p-5 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${isExpanded ? 'bg-slate-800' : 'bg-slate-800/50'}`}>
                                            <Icon className={`w-6 h-6 ${isExpanded ? 'text-indigo-400' : 'text-slate-500'}`} />
                                        </div>
                                        <div className="text-left">
                                            <h4 className={`text-sm font-black uppercase tracking-wide text-white`}>
                                                {catKey}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className={`h-full ${hasCriticalFail ? 'bg-red-500' : 'bg-emerald-500'}`} style={{width: `${progress}%`}}></div>
                                                </div>
                                                <span className="text-[10px] font-mono text-slate-400">{compliantCount}/{totalCount}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {hasCriticalFail && !isExpanded && (
                                            <div className="bg-red-500/20 p-2 rounded-full animate-pulse">
                                                <AlertCircle className="w-4 h-4 text-red-500" />
                                            </div>
                                        )}
                                        {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="p-5 pt-0 border-t border-slate-800/50 space-y-3 animate-fade-in-down">
                                        <div className="h-4"></div> {/* Spacer */}
                                        {typedItems.map(c => (
                                            <div 
                                                key={c.code} 
                                                onClick={() => onToggleBpa(c.code)} 
                                                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 group ${c.compliant ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}
                                            >
                                                <div className={`mt-0.5 p-1 rounded-full shrink-0 border ${c.compliant ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-transparent border-slate-600 text-transparent'}`}>
                                                    <CheckCircle2 className="w-3 h-3" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[9px] font-black text-slate-500">{c.code}</span>
                                                        {c.complianceLevel === 'MAJOR' ? (
                                                            <span className="text-[8px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30 uppercase font-black tracking-wider">Mayor</span>
                                                        ) : (
                                                            <span className="text-[8px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 uppercase font-black tracking-wider">Menor</span>
                                                        )}
                                                    </div>
                                                    <p className={`text-xs font-bold leading-snug ${c.compliant ? 'text-emerald-100 line-through decoration-emerald-500/50' : 'text-slate-300'}`}>{c.label}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* ... (OTHER TABS - ASSETS, AGRONOMY, SST, TOOLS - SAME AS BEFORE) ... */}
        {subTab === 'assets' && (
            <div className="space-y-6 animate-fade-in">
                { /* Asset Management and Maintenance Forms */ }
                <form onSubmit={handleAddAssetSubmit} className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-700 space-y-4">
                  <h4 className="text-indigo-400 text-xs uppercase font-black mb-2 flex items-center gap-2"><Plus className="w-4 h-4" /> Nuevo Activo Fijo</h4>
                  <input value={assetName} onChange={e => setAssetName(e.target.value)} placeholder="Nombre (Ej: Despulpadora)" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" required />
                  <div className="grid grid-cols-2 gap-3">
                      <input type="number" value={assetPrice} onChange={e => setAssetPrice(e.target.value)} placeholder="Costo Adquisición" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" required />
                      <select value={assetLife} onChange={e => setAssetLife(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"><option value="5">5 Años</option><option value="10">10 Años</option><option value="20">20 Años</option></select>
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl text-xs uppercase">Añadir Activo</button>
                </form>
                
                <form onSubmit={handleAddMaintenance} className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-700 space-y-4">
                   <h4 className="text-amber-400 text-xs uppercase font-black mb-2 flex items-center gap-2"><Plus className="w-4 h-4" /> Nuevo Mantenimiento</h4>
                   <select value={maintMachineId} onChange={e=>setMaintMachineId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"><option value="">Seleccionar Máquina</option>{machines.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select>
                   <input value={maintDesc} onChange={e=>setMaintDesc(e.target.value)} placeholder="Descripción (Ej: Cambio de aceite)" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" required />
                   <div className="grid grid-cols-3 gap-3">
                       <input type="number" value={maintCost} onChange={e=>setMaintCost(e.target.value)} placeholder="Costo $" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" />
                       <input type="number" value={maintHours} onChange={e=>setMaintHours(e.target.value)} placeholder="Horas Uso" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" />
                       <input type="number" value={maintFuel} onChange={e=>setMaintFuel(e.target.value)} placeholder="Combustible (L)" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" />
                   </div>
                   <button type="submit" className="w-full bg-amber-600 text-white font-bold py-3 rounded-xl text-xs uppercase">Guardar Mantenimiento</button>
                </form>
            </div>
        )}

        {subTab === 'agronomy' && (
            <div className="space-y-6 animate-fade-in">
                 {/* Quick Entry Forms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <form onSubmit={handleAddRain} className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700"><h4 className="text-blue-400 text-xs uppercase font-black flex items-center gap-2 mb-2"><Droplets className="w-4 h-4"/> Pluviometría</h4><div className="flex gap-2"><input type="number" value={rainMm} onChange={e=>setRainMm(e.target.value)} placeholder="mm de Lluvia" className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-white" required /><button type="submit" className="bg-blue-600 text-white p-2 rounded-xl"><Plus/></button></div></form>
                    <form onSubmit={handleAddPheno} className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700"><h4 className="text-emerald-400 text-xs uppercase font-black flex items-center gap-2 mb-2"><Leaf className="w-4 h-4"/> Fenología</h4><div className="flex gap-2"><select value={phenoLotId} onChange={e=>setPhenoLotId(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"><option value="">Lote...</option>{costCenters.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><button type="submit" className="bg-emerald-600 text-white p-2 rounded-xl"><Plus/></button></div></form>
                </div>
                 <form onSubmit={handleAddPest} className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700 space-y-2"><h4 className="text-red-400 text-xs uppercase font-black flex items-center gap-2"><Bug className="w-4 h-4"/> Monitoreo Plagas</h4><div className="flex gap-2"><select value={pestLotId} onChange={e=>setPestLotId(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"><option value="">Lote...</option>{costCenters.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><input type="text" value={pestName} onChange={e=>setPestName(e.target.value)} placeholder="Plaga/Enfermedad" className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-white" required /><button type="submit" className="bg-red-600 text-white p-2 rounded-xl"><Plus/></button></div></form>
            </div>
        )}

        {subTab === 'sst' && (
            <div className="space-y-6 animate-fade-in">
                <form onSubmit={handleAddPPEsubmit} className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-700 space-y-4">
                    <h4 className="text-red-400 text-xs uppercase font-black mb-2 flex items-center gap-2"><Signature className="w-4 h-4" /> Registro de EPP</h4>
                    <select value={ppePersonnelId} onChange={e => setPpePersonnelId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"><option value="">Seleccionar Trabajador</option>{personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                    <input type="text" value={ppeItems} onChange={e => setPpeItems(e.target.value)} placeholder="Items (Ej: Guantes, Careta, Overol)" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" required />
                    <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-xl text-xs uppercase">Registrar Entrega</button>
                </form>

                <form onSubmit={handleAddWasteSubmit} className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-700 space-y-4">
                    <h4 className="text-emerald-400 text-xs uppercase font-black mb-2 flex items-center gap-2"><Recycle className="w-4 h-4" /> Trazabilidad de Residuos</h4>
                    <input type="text" value={wasteDescription} onChange={e => setWasteDescription(e.target.value)} placeholder="Descripción (Ej: Envases Amistar 1L)" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" required />
                    <input type="number" value={wasteQty} onChange={e => setWasteQty(e.target.value)} placeholder="Cantidad" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" required />
                    <label className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-700 cursor-pointer">
                        <input type="checkbox" checked={wasteTripleWashed} onChange={e => setWasteTripleWashed(e.target.checked)} className="h-5 w-5 rounded text-emerald-500 bg-slate-800 border-slate-600 focus:ring-emerald-500"/>
                        <span className="text-sm font-bold text-white flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> ¿Triple Lavado y Perforado?</span>
                    </label>
                    <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl text-xs uppercase">Registrar Disposición</button>
                </form>

                 <div className="space-y-3">
                    {wasteLogs.slice().reverse().map(log => <div key={log.id} className="bg-slate-900/50 p-3 rounded-xl flex justify-between items-center text-xs"><p className="text-slate-300">{log.quantity} x {log.itemDescription}</p><span className="text-emerald-400 font-bold">{log.tripleWashed && "TRIPLE LAVADO"}</span></div>)}
                    {ppeLogs.slice().reverse().map(log => <div key={log.id} className="bg-slate-900/50 p-3 rounded-xl flex justify-between items-center text-xs"><p className="text-slate-300">{log.personnelName}</p><span className="text-slate-400">{log.items.join(', ')}</span></div>)}
                 </div>
            </div>
        )}
        
        {subTab === 'tools' && (
            <div className="space-y-6 animate-fade-in">
                 <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-700 space-y-4">
                    <h4 className="text-amber-400 text-xs uppercase font-black mb-2 flex items-center gap-2"><Tractor className="w-4 h-4" /> Calibración y Dosificación Inteligente</h4>
                     
                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 relative">
                        <div className="absolute -top-3 -right-3 bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-lg">PASO 1</div>
                        <h5 className="text-[10px] font-black uppercase text-slate-400 mb-3 flex items-center gap-2">
                            <Gauge className="w-3 h-3" /> Calibración del Equipo
                        </h5>
                         <div className="space-y-3">
                            <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase ml-1">Descarga Boquilla</label>
                                <div className="flex">
                                    <input value={toolDischarge} onChange={e=>setToolDischarge(e.target.value)} placeholder="0.0" className="flex-1 bg-slate-800 border-y border-l border-slate-600 rounded-l-xl p-3 text-sm text-white font-mono" />
                                    <select value={toolDischargeUnit} onChange={e => setToolDischargeUnit(e.target.value as any)} className="bg-slate-800 border border-slate-600 rounded-r-xl px-2 text-xs text-amber-500 font-bold outline-none">
                                        <option value="L">L/min</option>
                                        <option value="ml">ml/min</option>
                                        <option value="cc">cc/min</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] text-slate-500 font-bold uppercase ml-1">Ancho Faja (m)</label>
                                    <input value={toolWidth} onChange={e=>setToolWidth(e.target.value)} placeholder="Metros" className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-sm text-white font-mono" />
                                </div>
                                <div>
                                    <label className="text-[9px] text-slate-500 font-bold uppercase ml-1">Velocidad (Km/h)</label>
                                    <input value={toolSpeed} onChange={e=>setToolSpeed(e.target.value)} placeholder="Km/h" className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-sm text-white font-mono" />
                                </div>
                            </div>
                         </div>
                         <div className="mt-4 p-4 rounded-2xl bg-amber-950/50 border border-amber-500/20 text-center flex items-center justify-between">
                            <div className="text-left">
                                <p className="text-[10px] uppercase font-black text-amber-500">Gasto de Agua</p>
                                <p className="text-[9px] text-slate-500">Volumen de aplicación</p>
                            </div>
                            <p className="text-3xl font-mono font-black text-white">{toolCalculations.LHa.toFixed(1)} <span className="text-xs text-amber-500">L/Ha</span></p>
                         </div>
                    </div>

                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 relative">
                        <div className="absolute -top-3 -right-3 bg-emerald-600 text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-lg">PASO 2</div>
                        <h5 className="text-[10px] font-black uppercase text-slate-400 mb-3 flex items-center gap-2">
                            <FlaskConical className="w-3 h-3" /> Preparación de Mezcla
                        </h5>
                         <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase ml-1">Tamaño Tanque</label>
                                <div className="flex items-center bg-slate-800 border border-slate-600 rounded-xl px-3">
                                    <input value={toolTank} onChange={e=>setToolTank(e.target.value)} placeholder="0" className="w-full bg-transparent border-none p-3 pl-0 text-sm text-white font-mono outline-none" />
                                    <span className="text-xs text-slate-500 font-bold">Lts</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase ml-1">Dosis Recomendada</label>
                                <div className="flex">
                                    <input value={toolDose} onChange={e=>setToolDose(e.target.value)} placeholder="0.0" className="flex-1 bg-slate-800 border-y border-l border-slate-600 rounded-l-xl p-3 text-sm text-white font-mono w-full min-w-0" />
                                    <select value={toolDoseUnit} onChange={e => setToolDoseUnit(e.target.value as any)} className="bg-slate-800 border border-slate-600 rounded-r-xl px-1 text-[10px] text-emerald-500 font-bold outline-none max-w-[60px]">
                                        <option value="cc">cc/Ha</option>
                                        <option value="ml">ml/Ha</option>
                                        <option value="L">L/Ha</option>
                                        <option value="g">g/Ha</option>
                                        <option value="Kg">Kg/Ha</option>
                                    </select>
                                </div>
                            </div>
                         </div>
                          <div className="mt-4 p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/20 text-center">
                            <p className="text-[10px] uppercase font-black text-emerald-500 mb-1">Producto a agregar al Tanque</p>
                            <p className="text-3xl font-mono font-black text-white">{toolCalculations.productPerTank.toFixed(1)} <span className="text-lg text-emerald-400">{toolDoseUnit}</span></p>
                            <p className="text-[9px] text-slate-500 mt-1 italic">Calculado automáticamente según el gasto de agua.</p>
                         </div>
                    </div>

                 </div>
            </div>
        )}

    </div>
  );
};
