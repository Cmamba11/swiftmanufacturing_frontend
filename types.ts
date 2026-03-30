export enum ProductType {
  ROLLER = 'Roller',
  PACKING_BAG = 'Packing Bag'
}

export enum UnitType {
  KG = 'KG',
  PCS = 'Pcs'
}

export enum TransactionType {
  PRODUCTION_IN = 'Production In',
  DISPATCH_OUT = 'Dispatch (Supply)',
  RETURN_IN = 'Return In',
  ISSUANCE = 'Issuance',
  ADJUSTMENT = 'Adjustment'
}

export enum UserRole {
  ADMIN = 'Administrator',
  PRODUCTION_SUPERVISOR = 'Production Supervisor',
  WAREHOUSE_OFFICER = 'Warehouse Officer',
  LOGISTICS_OFFICER = 'Logistics Officer',
  MANAGEMENT = 'Management'
}

export enum MachineType {
  EXTRUSION_ROLLERS = 'Rollers Extrusion',
  EXTRUSION_BAGS = 'Packing Bags Extrusion',
  SLITTING = 'Slitting Machine',
  CUTTING = 'Cutting Machine',
  PRINTING = 'Printing Machine'
}

export enum Shift {
  DAY = 'Day Shift (12h)',
  NIGHT = 'Night Shift (12h)'
}

export enum MaterialGrade {
  HD = 'HD',
  LLD = 'LLD',
  EXCEED = 'EXCEED',
  IPA = 'IPA',
  TULANE = 'TULANE'
}

export interface MaterialStock {
  [MaterialGrade.HD]: number;
  [MaterialGrade.LLD]: number;
  [MaterialGrade.EXCEED]: number;
  [MaterialGrade.IPA]: number;
  [MaterialGrade.TULANE]: number;
}

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  specification: string;
  size: string;
  unit: UnitType; 
  storageLocation: string;
  minStockLevel: number; 
  minQuantityLevel?: number;
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  address: string;
}

export interface Transaction {
  id: string;
  productId: string;
  type: TransactionType;
  quantity: number; 
  weight?: number; 
  customerId?: string;
  referenceNumber: string;
  timestamp: number;
  recordedBy: string;
  shift?: Shift;
  rollsUsed?: number;
  kgUsed?: number;
  notes?: string;
  voided?: boolean;
  vehicleId?: string;
}

export interface IssuingRecord {
  id: string;
  date: string;
  shift: Shift;
  machineType: MachineType;
  // For Extrusion
  materialBags?: {
    [key in MaterialGrade]: number;
  };
  // For Slitting/Cutting
  rollsIssued?: number;
  weightIssued?: number;
  totalInputKg: number;
  totalIssuedKg: number; 
  timestamp: number;
}

export interface ProductionRecord {
  id: string;
  date: string;
  shift: Shift;
  machineType: MachineType;
  actualOutputKg: number;
  actualCount?: number;
  rollsUsed?: number;
  kgUsed?: number;
  timestamp: number;
}

export interface StockMetric {
  quantity: number;
  weight: number;
}

export interface InventoryStats {
  global: StockMetric;   
  factory: StockMetric;  
  partners: StockMetric; 
  in: StockMetric;       
  out: StockMetric;      
}

export interface SparePart {
  id: string;
  name: string;
  partNumber: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  location: string;
  date?: string;      // Added
  timestamp?: number; // Added (as number for frontend)
}

export interface SparePartIssuance {
  id: string;
  partId: string;
  quantity: number;
  issuedTo: string;
  date: string;
  timestamp: number;
  notes?: string;
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  active: boolean;
}

export interface ManagedUser extends AuthUser {
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  username: string;
  name: string;
  role: UserRole;
  password: string;
  active: boolean;
}

export interface UpdateUserInput {
  username?: string;
  name?: string;
  role?: UserRole;
  active?: boolean;
}

export const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: ['view_all', 'edit_products', 'delete_products', 'edit_customers', 'delete_customers', 'void_transactions', 'manage_users', 'customer_asset_adjustment', 'record_issuance', 'warehouse_control', 'manage_materials', 'production_intake', 'dispatch_goods'],
  [UserRole.MANAGEMENT]: ['view_all', 'warehouse_control'],
  [UserRole.PRODUCTION_SUPERVISOR]: ['view_all', 'production_intake', 'warehouse_control'],
  [UserRole.WAREHOUSE_OFFICER]: ['view_all', 'production_intake', 'dispatch_goods', 'warehouse_control', 'manage_materials'],
  [UserRole.LOGISTICS_OFFICER]: ['view_all', 'dispatch_goods', 'record_issuance'],
};