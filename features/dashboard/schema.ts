export type DashboardKpis = {
  stockValue: number;
  receivables: number;
  payables: number;
  cashBalance: number;
  monthSales: number;
  monthPurchases: number;
  overdueCount: number;
  overdueAmount: number;
};

export type DashboardCounts = {
  itemCount: number;
  warehouseCount: number;
  openSO: number;
  openPO: number;
  openWO: number;
  lowStockCount: number;
};

export type WarehouseValue = { warehouse: string; value: number };

export type MonthlyPoint = {
  month: string;
  sales: number;
  purchases: number;
};

export type CashPoint = {
  month: string;
  balance: number;
};

export type TopItem = {
  itemId: string;
  itemCode: string;
  itemName: string;
  qty: number;
  value: number;
};

export type OpenSalesOrder = {
  id: string;
  name: string;
  customer: string;
  totalAmount: number;
};

export type RecentMovement = {
  id: string;
  itemId: string;
  itemCode: string;
  warehouse: string;
  actualQty: number;
  voucherType: string;
  voucherNo: string;
};

export type RecentGL = {
  id: string;
  account: string;
  voucherNo: string;
  debit: number;
  credit: number;
};

export type LowStockItem = {
  itemId: string;
  itemCode: string;
  itemName: string;
  qty: number;
  reorderLevel: number;
};

export type DashboardData = {
  kpis: DashboardKpis;
  counts: DashboardCounts;
  monthlyTrend: MonthlyPoint[];
  cashTrend: CashPoint[];
  stockByWarehouse: WarehouseValue[];
  topItems: TopItem[];
  openSalesOrders: OpenSalesOrder[];
  recentMovements: RecentMovement[];
  recentGL: RecentGL[];
  lowStockItems: LowStockItem[];
};
