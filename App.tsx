import React, { useEffect, useMemo, useState } from 'react';
import {
  Product,
  Transaction,
  TransactionType,
  Customer,
  UserRole,
  ROLE_PERMISSIONS,
  IssuingRecord,
  ProductionRecord,
  MaterialStock,
  MaterialGrade,
  SparePart,
  SparePartIssuance,
  AuthUser,
  ManagedUser,
  CreateUserInput,
  UpdateUserInput,
} from './types';
import { calculateInventory } from './utils';
import { api, ApiError } from './services/api';
import Dashboard from './components/Dashboard';
import ProductMaster from './components/ProductMaster';
import Receiving from './components/Receiving';
import Dispatch from './components/Dispatch';
import Ledger from './components/Ledger';
import CustomerInsights from './components/CustomerInsights';
import WarehouseSystem from './components/WarehouseSystem';
import UserManagement from './components/UserManagement';

type Tab = 'dashboard' | 'products' | 'receiving' | 'dispatch' | 'ledger' | 'customers' | 'warehouse' | 'users';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [issuingRecords, setIssuingRecords] = useState<IssuingRecord[]>([]);
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>([]);
  const [materialStock, setMaterialStock] = useState<MaterialStock>({
    [MaterialGrade.HD]: 0,
    [MaterialGrade.LLD]: 0,
    [MaterialGrade.EXCEED]: 0,
    [MaterialGrade.IPA]: 0,
    [MaterialGrade.TULANE]: 0,
  });
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [sparePartIssuances, setSparePartIssuances] = useState<SparePartIssuance[]>([]);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);

  const userRole = currentUser?.role ?? UserRole.MANAGEMENT;

  const handleApiError = (error: unknown, fallback = 'Request failed.') => {
    if (error instanceof ApiError && error.status === 401) {
      api.logout();
      setCurrentUser(null);
      setAuthError('Session expired. Please sign in again.');
      return;
    }

    const message = error instanceof ApiError ? error.message : fallback;
    alert(message);
    console.error(error);
  };

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      const token = api.getToken();
      if (!token) {
        if (active) setAuthLoading(false);
        return;
      }

      try {
        const me = await api.getMe();
        if (active) {
          setCurrentUser(me);
          setAuthError('');
        }
      } catch {
        api.logout();
        if (active) {
          setCurrentUser(null);
          setAuthError('Please sign in to continue.');
        }
      } finally {
        if (active) setAuthLoading(false);
      }
    };

    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const canManageUsers = ROLE_PERMISSIONS[currentUser.role].includes('manage_users');
        const [prods, trxs, custs, issuing, production, stock, parts, issuances, users] = await Promise.all([
          api.getProducts(),
          api.getTransactions(),
          api.getCustomers(),
          api.getIssuingRecords(),
          api.getProductionRecords(),
          api.getMaterialStock(),
          api.getSpareParts(),
          api.getSpareIssuances(),
          canManageUsers ? api.getUsers() : Promise.resolve([] as ManagedUser[]),
        ]);

        if (!active) return;

        setProducts(prods);
        setTransactions(trxs);
        setCustomers(custs);
        setIssuingRecords(issuing);
        setProductionRecords(production);
        setMaterialStock(stock);
        setSpareParts(parts);
        setSparePartIssuances(issuances);
        setManagedUsers(users);
      } catch (error) {
        handleApiError(error, 'Failed to load application data.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchData();
    return () => {
      active = false;
    };
  }, [currentUser]);

  const inventoryStats = useMemo(() => calculateInventory(products, transactions), [products, transactions]);

  const hasPermission = (permission: string) => ROLE_PERMISSIONS[userRole].includes(permission);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);

    try {
      const user = await api.login(loginForm.username, loginForm.password);
      setCurrentUser(user);
      setActiveTab('dashboard');
      setLoginForm({ username: '', password: '' });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Login failed.';
      setAuthError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setActiveTab('dashboard');
    setIsMobileMenuOpen(false);
    setProducts([]);
    setTransactions([]);
    setCustomers([]);
    setIssuingRecords([]);
    setProductionRecords([]);
    setSpareParts([]);
    setSparePartIssuances([]);
    setManagedUsers([]);
    setMaterialStock({
      [MaterialGrade.HD]: 0,
      [MaterialGrade.LLD]: 0,
      [MaterialGrade.EXCEED]: 0,
      [MaterialGrade.IPA]: 0,
      [MaterialGrade.TULANE]: 0,
    });
  };

  const addProduct = async (product: Product) => {
    try {
      const created = await api.addProduct(product);
      setProducts((prev) => [...prev, created]);
    } catch (error) {
      handleApiError(error, 'Failed to add product.');
    }
  };

  const updateProduct = async (updated: Product) => {
    try {
      const saved = await api.updateProduct(updated.id, updated);
      setProducts((prev) => prev.map((product) => (product.id === saved.id ? saved : product)));
    } catch (error) {
      handleApiError(error, 'Failed to update product.');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete product?')) return;

    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((product) => product.id !== id));
    } catch (error) {
      handleApiError(error, 'Failed to delete product.');
    }
  };

  const addTransaction = async (transaction: Transaction) => {
    try {
      const newTransaction = await api.addTransaction(transaction);
      setTransactions((prev) => [newTransaction, ...prev]);
    } catch (error) {
      handleApiError(error, 'Failed to add transaction.');
    }
  };

  const voidTransaction = async (id: string) => {
    if (!confirm('Void transaction?')) return;

    try {
      await api.voidTransaction(id);
      setTransactions((prev) => prev.map((transaction) => (transaction.id === id ? { ...transaction, voided: true } : transaction)));
    } catch (error) {
      handleApiError(error, 'Failed to void transaction.');
    }
  };

  const addCustomer = async (customer: Customer) => {
    try {
      const newCustomer = await api.addCustomer(customer);
      setCustomers((prev) => [newCustomer, ...prev]);
    } catch (error) {
      handleApiError(error, 'Failed to add customer.');
    }
  };

  const updateCustomer = async (updated: Customer) => {
    try {
      const saved = await api.updateCustomer(updated.id, updated);
      setCustomers((prev) => prev.map((customer) => (customer.id === saved.id ? saved : customer)));
    } catch (error) {
      handleApiError(error, 'Failed to update customer.');
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!confirm('Delete customer?')) return;

    try {
      await api.deleteCustomer(id);
      setCustomers((prev) => prev.filter((customer) => customer.id !== id));
    } catch (error) {
      handleApiError(error, 'Failed to delete customer.');
    }
  };

  const addIssuingRecord = async (record: IssuingRecord) => {
    try {
      const newRecord = await api.addIssuingRecord(record);
      setIssuingRecords((prev) => [newRecord, ...prev]);

      const refreshedStock = await api.getMaterialStock();
      setMaterialStock(refreshedStock);

      if (record.machineType === 'Slitting Machine' || record.machineType === 'Cutting Machine') {
        await addTransaction({
          id: `trx-iss-${Date.now()}`,
          productId: 'prod-rollers',
          type: TransactionType.ISSUANCE,
          quantity: record.rollsIssued || 0,
          weight: record.weightIssued || 0,
          referenceNumber: `ISS-${record.date}-${record.shift.slice(0, 1)}`,
          timestamp: Date.now(),
          recordedBy: currentUser?.name ?? userRole,
          notes: `Issuance for ${record.machineType}`,
        });
      }
    } catch (error) {
      handleApiError(error, 'Failed to add issuing record.');
    }
  };

  const addProductionRecord = async (record: ProductionRecord) => {
    try {
      const newRecord = await api.addProductionRecord(record);
      setProductionRecords((prev) => {
        const filtered = prev.filter(
          (existing) => !(existing.date === record.date && existing.shift === record.shift && existing.machineType === record.machineType),
        );
        return [newRecord, ...filtered];
      });

      await addTransaction({
        id: `trx-prod-${Date.now()}`,
        productId: 'prod-bags',
        type: TransactionType.PRODUCTION_IN,
        quantity: record.actualCount || record.actualOutputKg * 84.5,
        weight: record.actualOutputKg,
        referenceNumber: `PROD-${record.date}-${record.shift.slice(0, 1)}`,
        timestamp: Date.now(),
        recordedBy: currentUser?.name ?? userRole,
        notes: `Production from ${record.machineType}`,
      });
    } catch (error) {
      handleApiError(error, 'Failed to add production record.');
    }
  };

  const updateMaterialStock = async (grade: MaterialGrade, amount: number) => {
    try {
      await api.updateMaterialStock(grade, amount);
      const updatedStock = await api.getMaterialStock();
      setMaterialStock(updatedStock);
    } catch (error) {
      handleApiError(error, 'Failed to update material stock.');
    }
  };

  const addSparePart = async (part: SparePart) => {
    try {
      const newPart = await api.addSparePart(part);
      setSpareParts((prev) => [newPart, ...prev]);
    } catch (error) {
      handleApiError(error, 'Failed to add spare part.');
    }
  };

  const updateSparePart = async (updated: SparePart) => {
    try {
      const saved = await api.updateSparePart(updated.id, updated);
      setSpareParts((prev) => prev.map((part) => (part.id === saved.id ? saved : part)));
    } catch (error) {
      handleApiError(error, 'Failed to update spare part.');
    }
  };

  const addSpareIssuance = async (issuance: SparePartIssuance) => {
    try {
      const newIssuance = await api.addSpareIssuance(issuance);
      setSparePartIssuances((prev) => [newIssuance, ...prev]);

      const updatedParts = await api.getSpareParts();
      setSpareParts(updatedParts);
    } catch (error) {
      handleApiError(error, 'Failed to add spare issuance.');
    }
  };

  const addUser = async (data: CreateUserInput) => {
    try {
      const created = await api.createUser(data);
      setManagedUsers((prev) => [...prev, created]);
    } catch (error) {
      handleApiError(error, 'Failed to create user.');
    }
  };

  const updateUser = async (id: string, data: UpdateUserInput) => {
    try {
      const updated = await api.updateUser(id, data);
      setManagedUsers((prev) => prev.map((user) => (user.id === id ? updated : user)));
    } catch (error) {
      handleApiError(error, 'Failed to update user.');
    }
  };

  const resetUserPassword = async (id: string, password: string) => {
    try {
      await api.resetUserPassword(id, password);
      alert('Password reset completed.');
    } catch (error) {
      handleApiError(error, 'Failed to reset password.');
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await api.deleteUser(id);
      setManagedUsers((prev) => prev.filter((user) => user.id !== id));
    } catch (error) {
      handleApiError(error, 'Failed to delete user.');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard products={products} stats={inventoryStats} transactions={transactions} />;
      case 'products':
        return (
          <ProductMaster
            products={products}
            customers={customers}
            transactions={transactions}
            stats={inventoryStats}
            onAdd={addProduct}
            onUpdate={updateProduct}
            onDelete={deleteProduct}
            onAddTransaction={addTransaction}
            userRole={userRole}
            canEdit={hasPermission('edit_products')}
            canDelete={hasPermission('delete_products')}
          />
        );
      case 'receiving':
        return (
          <Receiving
            products={products}
            customers={customers}
            onAddTransaction={addTransaction}
            userRole={userRole}
            canCreate={hasPermission('production_intake')}
          />
        );
      case 'dispatch':
        return (
          <Dispatch
            products={products}
            customers={customers}
            stats={inventoryStats}
            transactions={transactions}
            onAddTransaction={addTransaction}
            userRole={userRole}
            canSubmit={hasPermission('dispatch_goods') || hasPermission('record_issuance')}
          />
        );
    case 'ledger':
  return (
    <Ledger
      products={products}
      transactions={transactions}
      customers={customers}
      issuingRecords={issuingRecords}
      sparePartIssuances={sparePartIssuances}
      spareParts={spareParts}
      materialInboundRecords={[]} // replace later with API data if you have it
      onVoid={voidTransaction}
      canVoid={hasPermission('void_transactions')}
    />
  );
           
      case 'customers':
        return (
          <CustomerInsights
            customers={customers}
            products={products}
            transactions={transactions}
            onAddCustomer={addCustomer}
            onUpdateCustomer={updateCustomer}
            onDeleteCustomer={deleteCustomer}
            canEdit={hasPermission('edit_customers')}
            canAdjustAssets={hasPermission('customer_asset_adjustment')}
            onAddTransaction={addTransaction}
            onAddProduct={addProduct}
            userRole={userRole}
          />
        );
      case 'warehouse':
        return (
          <WarehouseSystem
            issuingRecords={issuingRecords}
            productionRecords={productionRecords}
            materialStock={materialStock}
            spareParts={spareParts}
            sparePartIssuances={sparePartIssuances}
            onAddIssuing={addIssuingRecord}
            onAddProduction={addProductionRecord}
            onUpdateMaterialStock={updateMaterialStock}
            onAddSparePart={addSparePart}
            onUpdateSparePart={updateSparePart}
            onAddSpareIssuance={addSpareIssuance}
            canRecordIssuing={hasPermission('record_issuance')}
            canRecordProduction={hasPermission('production_intake')}
            canManageMaterials={hasPermission('manage_materials')}
            canManageSpareParts={hasPermission('manage_materials')}
            canRecordSpareIssuance={hasPermission('record_issuance')}
          />
        );
      case 'users':
        if (!currentUser) return null;
        return (
          <UserManagement
            currentUser={currentUser}
            users={managedUsers}
            onCreateUser={addUser}
            onUpdateUser={updateUser}
            onResetUserPassword={resetUserPassword}
            onDeleteUser={deleteUser}
          />
        );
      default:
        return <Dashboard products={products} stats={inventoryStats} transactions={transactions} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line', p: 'view_all' },
    { id: 'warehouse', label: 'Warehouse Control', icon: 'fa-industry', p: 'warehouse_control' },
    { id: 'products', label: 'Factory Inventory', icon: 'fa-box-open', p: 'view_all' },
    { id: 'receiving', label: 'Production', icon: 'fa-industry', p: 'production_intake' },
    { id: 'dispatch', label: 'Dispatch', icon: 'fa-shipping-fast', p: 'dispatch_goods' },
    { id: 'ledger', label: 'Central Ledger', icon: 'fa-list-alt', p: 'view_all' },
    { id: 'customers', label: 'Partner Assets', icon: 'fa-users', p: 'view_all' },
    { id: 'users', label: 'User Management', icon: 'fa-user-shield', p: 'manage_users' },
  ] as const;

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#003366] border-t-[#4DB848] rounded-full animate-spin"></div>
          <p className="text-[#003366] font-black uppercase tracking-widest text-xs">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
          <div className="bg-[#003366] p-8 text-white">
            <h1 className="text-3xl font-black tracking-tight uppercase">Swift Login</h1>
            <p className="text-blue-100 text-sm mt-2">Sign in with your backend user account.</p>
          </div>

          <form className="p-8 space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Username</label>
              <input
                required
                value={loginForm.username}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, username: event.target.value }))}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl outline-none focus:border-[#4DB848] font-bold text-slate-700"
                placeholder="admin"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
              <input
                required
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl outline-none focus:border-[#4DB848] font-bold text-slate-700"
                placeholder="••••••••"
              />
            </div>

            {authError && <p className="text-xs font-bold text-red-600 uppercase tracking-widest">{authError}</p>}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-[#4DB848] disabled:opacity-60 text-[#003366] py-3 rounded-xl font-black uppercase tracking-widest"
            >
              {isLoggingIn ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Default seed user: <span className="text-slate-600">admin / admin123</span>
            </p>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#003366] border-t-[#4DB848] rounded-full animate-spin"></div>
          <p className="text-[#003366] font-black uppercase tracking-widest text-xs">Loading secured workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="bg-white text-[#003366] p-4 shadow-lg border-b-4 border-[#4DB848] flex justify-between items-center z-30 relative">
        <div className="flex items-center space-x-4 md:space-x-6">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-[#003366] hover:bg-slate-100 rounded-xl transition-all"
          >
            <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
          </button>
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10 md:w-12 md:h-12">
              <div className="absolute inset-0 bg-[#003366] rounded-lg rotate-45 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-[#4DB848] -translate-x-1/2 -rotate-45 opacity-80"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <i className="fa-solid fa-arrows-rotate text-white text-lg md:text-xl animate-[spin_10s_linear_infinite]"></i>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl md:text-3xl font-black italic tracking-tighter text-[#003366] leading-none">swift</span>
              <span className="text-[8px] md:text-[10px] font-black tracking-[0.4em] text-[#4DB848] leading-none mt-1">PLASTICS INC.</span>
            </div>
          </div>
          <div className="hidden lg:flex flex-col border-l-2 border-slate-100 pl-8 h-12 justify-center">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#003366]">Operations Core</h2>
            <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Inventory Management System</h3>
          </div>
        </div>

        <div className="flex items-center space-x-4 md:space-x-6">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] text-[#4DB848] font-black uppercase tracking-[0.2em] mb-0.5">Signed In</span>
            <span className="text-xs font-black text-[#003366] bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
              {currentUser.name} ({currentUser.role})
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="bg-[#003366] text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#002855]"
          >
            <i className="fa-solid fa-right-from-bracket mr-2"></i>
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
        )}

        <nav
          className={`
          fixed inset-y-0 left-0 w-64 bg-[#003366] z-20 transform transition-transform duration-300 md:relative md:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          overflow-y-auto shadow-2xl
        `}
        >
          <div className="p-6 space-y-2">
            <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.25em] mb-6 px-4">Menu Interface</p>
            {navItems.filter((item) => hasPermission(item.p)).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as Tab);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${
                  activeTab === item.id
                    ? 'bg-[#4DB848] text-[#003366] shadow-lg shadow-black/20 font-bold translate-x-1'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
                    activeTab === item.id ? 'bg-white/20' : 'bg-white/5 group-hover:bg-[#4DB848]/20'
                  }`}
                >
                  <i
                    className={`fa-solid ${item.icon} text-lg ${
                      activeTab === item.id ? 'text-[#003366]' : 'group-hover:text-[#4DB848]'
                    }`}
                  ></i>
                </div>
                <span className="text-xs font-black tracking-widest uppercase">{item.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-auto p-8 border-t border-white/5">
            <div className="bg-white/5 rounded-2xl p-4">
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Auth Session</p>
              <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-[#4DB848] h-full w-[100%]"></div>
              </div>
              <p className="text-[8px] font-bold text-[#4DB848] uppercase mt-2">Secure Connection</p>
            </div>
          </div>
        </nav>

        <main className="flex-1 bg-slate-50 overflow-y-auto p-4 md:p-8 lg:p-12">
          <div className="max-w-6xl mx-auto h-full">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
};

export default App;
