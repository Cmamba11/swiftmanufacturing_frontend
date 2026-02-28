
import { Product, Transaction, Customer, TransactionType, ProductType, UnitType, InventoryStats, StockMetric } from './types';

export const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const getFromStorage = <T,>(key: string, defaultValue: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) return defaultValue;
  try {
    return JSON.parse(stored) as T;
  } catch {
    return defaultValue;
  }
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-rollers',
    name: 'Rollers',
    type: ProductType.ROLLER,
    unit: UnitType.PCS,
    specification: 'Standard Roller',
    size: 'N/A',
    storageLocation: 'Factory Floor',
    minStockLevel: 100
  },
  {
    id: 'prod-bags',
    name: 'Packing Bags',
    type: ProductType.PACKING_BAG,
    unit: UnitType.PCS,
    specification: 'Standard Bag',
    size: 'N/A',
    storageLocation: 'Factory Reserve',
    minStockLevel: 1000
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [];

const createEmptyMetric = (): StockMetric => ({ quantity: 0, weight: 0 });

export const calculateInventory = (products: Product[], transactions: Transaction[]) => {
  const stats: Record<string, InventoryStats> = {};
  const productMap = new Map(products.map(p => [p.id, p]));

  products.forEach(p => { 
    stats[p.id] = { 
      global: createEmptyMetric(), 
      factory: createEmptyMetric(), 
      partners: createEmptyMetric(),
      in: createEmptyMetric(), 
      out: createEmptyMetric() 
    }; 
  });

  transactions.filter(t => !t.voided).forEach(t => {
    const product = productMap.get(t.productId);
    if (!product || !stats[t.productId]) return;
    
    const qty = t.quantity || 0;
    const wgt = t.weight || 0;
    const isRoller = product.type === ProductType.ROLLER;

    switch (t.type) {
      case TransactionType.PRODUCTION_IN:
        stats[t.productId].in.quantity += qty;
        stats[t.productId].in.weight += wgt;
        stats[t.productId].global.quantity += qty;
        stats[t.productId].global.weight += wgt;
        
        if (isRoller && t.customerId) {
          stats[t.productId].partners.quantity += qty;
          stats[t.productId].partners.weight += wgt;
        } else {
          stats[t.productId].factory.quantity += qty;
          stats[t.productId].factory.weight += wgt;
        }
        break;

      case TransactionType.DISPATCH_OUT:
        if (isRoller) {
          stats[t.productId].factory.quantity -= qty;
          stats[t.productId].factory.weight -= wgt;
          stats[t.productId].partners.quantity += qty;
          stats[t.productId].partners.weight += wgt;
        } else {
          stats[t.productId].factory.quantity -= qty;
          stats[t.productId].global.quantity -= qty;
          stats[t.productId].out.quantity += qty;
        }
        break;

      case TransactionType.ISSUANCE:
        if (isRoller) {
          stats[t.productId].out.quantity += qty;
          stats[t.productId].out.weight += wgt;
          stats[t.productId].partners.quantity -= qty;
          stats[t.productId].partners.weight -= wgt;
          stats[t.productId].global.quantity -= qty;
          stats[t.productId].global.weight -= wgt;
        } else {
          stats[t.productId].out.quantity += qty;
          stats[t.productId].factory.quantity -= qty;
          stats[t.productId].global.quantity -= qty;
        }
        break;

      case TransactionType.RETURN_IN:
        if (isRoller) {
          stats[t.productId].partners.quantity -= qty;
          stats[t.productId].partners.weight -= wgt;
          stats[t.productId].factory.quantity += qty;
          stats[t.productId].factory.weight += wgt;
        } else {
          stats[t.productId].factory.quantity += qty;
          stats[t.productId].global.quantity += qty;
        }
        break;

      case TransactionType.ADJUSTMENT:
        if (t.customerId && isRoller) {
          stats[t.productId].partners.quantity += qty;
          stats[t.productId].partners.weight += wgt;
          stats[t.productId].global.quantity += qty;
          stats[t.productId].global.weight += wgt;
        } else {
          stats[t.productId].factory.quantity += qty;
          stats[t.productId].factory.weight += wgt;
          stats[t.productId].global.quantity += qty;
          stats[t.productId].global.weight += wgt;
        }
        break;
    }
  });
  return stats;
};

export const calculateCustomerInventory = (customerId: string, transactions: Transaction[], products: Product[]) => {
  const customerStock: Record<string, StockMetric> = {};
  const productMap = new Map(products.map(p => [p.id, p]));
  
  transactions.filter(t => t.customerId === customerId && !t.voided).forEach(t => {
    const product = productMap.get(t.productId);
    if (!product || product.type !== ProductType.ROLLER) return;

    if (!customerStock[t.productId]) {
      customerStock[t.productId] = createEmptyMetric();
    }
    
    const qty = t.quantity || 0;
    const wgt = t.weight || 0;

    if (t.type === TransactionType.PRODUCTION_IN || t.type === TransactionType.DISPATCH_OUT || (t.type === TransactionType.ADJUSTMENT)) {
      customerStock[t.productId].quantity += qty;
      customerStock[t.productId].weight += wgt;
    } 
    else if (t.type === TransactionType.ISSUANCE || t.type === TransactionType.RETURN_IN) {
      customerStock[t.productId].quantity -= qty;
      customerStock[t.productId].weight -= wgt;
    }
  });
  return customerStock;
};
