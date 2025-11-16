import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  MapPin, 
  Search,
  Download,
  Plus,
  Truck,
  Box,
  Archive
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: 'supplies' | 'equipment' | 'packaging' | 'vehicle-parts';
  quantity: number;
  minThreshold: number;
  unit: string;
  location: string;
  lastRestocked: string;
  cost: number;
}

const mockInventory: InventoryItem[] = [
  {
    id: '1',
    name: 'Shipping Boxes (Large)',
    sku: 'PKG-001',
    category: 'packaging',
    quantity: 45,
    minThreshold: 100,
    unit: 'units',
    location: 'Helsinki Warehouse',
    lastRestocked: '2025-11-10',
    cost: 2.50
  },
  {
    id: '2',
    name: 'Bubble Wrap Rolls',
    sku: 'PKG-002',
    category: 'packaging',
    quantity: 28,
    minThreshold: 50,
    unit: 'rolls',
    location: 'Helsinki Warehouse',
    lastRestocked: '2025-11-08',
    cost: 15.00
  },
  {
    id: '3',
    name: 'Packing Tape',
    sku: 'SUP-001',
    category: 'supplies',
    quantity: 156,
    minThreshold: 80,
    unit: 'rolls',
    location: 'Helsinki Warehouse',
    lastRestocked: '2025-11-14',
    cost: 3.20
  },
  {
    id: '4',
    name: 'Handheld Scanners',
    sku: 'EQP-001',
    category: 'equipment',
    quantity: 12,
    minThreshold: 10,
    unit: 'units',
    location: 'Helsinki Warehouse',
    lastRestocked: '2025-10-25',
    cost: 450.00
  },
  {
    id: '5',
    name: 'Delivery Vehicle Tires',
    sku: 'VEH-001',
    category: 'vehicle-parts',
    quantity: 8,
    minThreshold: 12,
    unit: 'units',
    location: 'Tampere Service Center',
    lastRestocked: '2025-11-01',
    cost: 180.00
  },
  {
    id: '6',
    name: 'Fragile Labels',
    sku: 'SUP-002',
    category: 'supplies',
    quantity: 320,
    minThreshold: 200,
    unit: 'sheets',
    location: 'Helsinki Warehouse',
    lastRestocked: '2025-11-15',
    cost: 0.15
  },
  {
    id: '7',
    name: 'Pallet Jacks',
    sku: 'EQP-002',
    category: 'equipment',
    quantity: 3,
    minThreshold: 5,
    unit: 'units',
    location: 'Turku Distribution',
    lastRestocked: '2025-09-20',
    cost: 850.00
  },
  {
    id: '8',
    name: 'Shipping Boxes (Medium)',
    sku: 'PKG-003',
    category: 'packaging',
    quantity: 210,
    minThreshold: 150,
    unit: 'units',
    location: 'Helsinki Warehouse',
    lastRestocked: '2025-11-13',
    cost: 1.80
  },
  {
    id: '9',
    name: 'Safety Vests',
    sku: 'SUP-003',
    category: 'supplies',
    quantity: 18,
    minThreshold: 25,
    unit: 'units',
    location: 'Helsinki Warehouse',
    lastRestocked: '2025-10-30',
    cost: 12.00
  },
  {
    id: '10',
    name: 'Engine Oil (5L)',
    sku: 'VEH-002',
    category: 'vehicle-parts',
    quantity: 24,
    minThreshold: 20,
    unit: 'bottles',
    location: 'Tampere Service Center',
    lastRestocked: '2025-11-12',
    cost: 35.00
  },
];

const categoryLabels = {
  'supplies': 'Supplies',
  'equipment': 'Equipment',
  'packaging': 'Packaging',
  'vehicle-parts': 'Vehicle Parts',
};

const categoryColors = {
  'supplies': 'bg-blue-100 text-blue-700',
  'equipment': 'bg-purple-100 text-purple-700',
  'packaging': 'bg-orange-100 text-orange-700',
  'vehicle-parts': 'bg-slate-100 text-slate-700',
};

export function InventoryManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredInventory = mockInventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = mockInventory.filter(item => item.quantity < item.minThreshold);
  const totalValue = mockInventory.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
  const totalItems = mockInventory.reduce((sum, item) => sum + item.quantity, 0);

  const getStockStatus = (item: InventoryItem) => {
    const percentage = (item.quantity / item.minThreshold) * 100;
    if (percentage < 50) return { label: 'Critical', color: 'bg-red-100 text-red-700' };
    if (percentage < 100) return { label: 'Low Stock', color: 'bg-amber-100 text-amber-700' };
    return { label: 'In Stock', color: 'bg-emerald-100 text-emerald-700' };
  };

  return (
    <div className="h-full overflow-auto bg-slate-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-[#0D6672]/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                <Package className="w-4 h-4 text-[#0D6672]" />
                Total Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl">{totalItems}</div>
              <p className="text-xs text-slate-500 mt-1">Across all locations</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl text-blue-600">€{totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              <p className="text-xs text-slate-500 mt-1">Current inventory</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Low Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl text-amber-600">{lowStockItems.length}</div>
              <p className="text-xs text-slate-500 mt-1">Require restocking</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-600" />
                Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl text-purple-600">3</div>
              <p className="text-xs text-slate-500 mt-1">Active warehouses</p>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alerts */}
        {lowStockItems.length > 0 && (
          <Card className="border-2 border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <AlertTriangle className="w-5 h-5" />
                Low Stock Alerts
              </CardTitle>
              <CardDescription className="text-amber-700">
                The following items are below their minimum threshold and require restocking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        {item.category === 'packaging' && <Box className="w-4 h-4 text-amber-700" />}
                        {item.category === 'equipment' && <Archive className="w-4 h-4 text-amber-700" />}
                        {item.category === 'supplies' && <Package className="w-4 h-4 text-amber-700" />}
                        {item.category === 'vehicle-parts' && <Truck className="w-4 h-4 text-amber-700" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-amber-700">{item.quantity} / {item.minThreshold}</p>
                      <p className="text-xs text-slate-500">{item.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inventory Table */}
        <Card className="border-2 border-[#0D6672]/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Inventory Items</CardTitle>
                <CardDescription>Manage and track all inventory across locations</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button size="sm" className="bg-[#0D6672] hover:bg-[#0a5259]">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filter */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory('all')}
                  className={filterCategory === 'all' ? 'bg-[#0D6672] hover:bg-[#0a5259]' : ''}
                >
                  All
                </Button>
                <Button
                  variant={filterCategory === 'packaging' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory('packaging')}
                  className={filterCategory === 'packaging' ? 'bg-[#0D6672] hover:bg-[#0a5259]' : ''}
                >
                  Packaging
                </Button>
                <Button
                  variant={filterCategory === 'supplies' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory('supplies')}
                  className={filterCategory === 'supplies' ? 'bg-[#0D6672] hover:bg-[#0a5259]' : ''}
                >
                  Supplies
                </Button>
                <Button
                  variant={filterCategory === 'equipment' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory('equipment')}
                  className={filterCategory === 'equipment' ? 'bg-[#0D6672] hover:bg-[#0a5259]' : ''}
                >
                  Equipment
                </Button>
                <Button
                  variant={filterCategory === 'vehicle-parts' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory('vehicle-parts')}
                  className={filterCategory === 'vehicle-parts' ? 'bg-[#0D6672] hover:bg-[#0a5259]' : ''}
                >
                  Vehicle Parts
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Last Restocked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => {
                    const status = getStockStatus(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-slate-500">{item.sku}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={categoryColors[item.category]}>
                            {categoryLabels[item.category]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.quantity}</p>
                            <p className="text-xs text-slate-500">{item.unit}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={status.color}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {item.location}
                          </div>
                        </TableCell>
                        <TableCell>€{item.cost.toFixed(2)}</TableCell>
                        <TableCell className="font-medium">
                          €{(item.quantity * item.cost).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {new Date(item.lastRestocked).toLocaleDateString('fi-FI')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
