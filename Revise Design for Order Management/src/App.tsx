import { useState } from 'react';
import { Order, OrderStatus } from './types/order';
import { mockOrders } from './data/mockOrders';
import { OrdersTable } from './components/OrdersTable';
import { OrderDetails } from './components/OrderDetails';
import { ChatInterface } from './components/ChatInterface';
import { Separator } from './components/ui/separator';

export default function App() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-[#0D6672] text-white px-6 py-4 shadow-sm">
        <h1 className="text-white">Operations Dashboard</h1>
        <p className="text-teal-100 text-sm mt-1">Manage delivery orders and support requests</p>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Orders Table */}
        <div className="w-[60%] border-r bg-white">
          <OrdersTable
            orders={mockOrders}
            selectedOrderId={selectedOrder?.id}
            onSelectOrder={setSelectedOrder}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </div>

        {/* Right Panel - Order Details & Chat */}
        <div className="w-[40%] flex flex-col bg-white">
          {selectedOrder ? (
            <>
              {/* Order Details - Top Half */}
              <div className="h-[50%] overflow-auto border-b p-6">
                <OrderDetails order={selectedOrder} />
              </div>

              {/* Chat Interface - Bottom Half */}
              <div className="h-[50%] overflow-hidden">
                <ChatInterface order={selectedOrder} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <p className="text-sm">Select an order to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}