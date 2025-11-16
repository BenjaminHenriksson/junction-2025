import { Order } from '../types/order';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Package, MapPin, Calendar, DollarSign } from 'lucide-react';
import { AlertCircle, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

interface OrderDetailsProps {
  order: Order;
}

const statusConfig = {
  support_required: {
    label: 'Support Requested',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: AlertCircle,
  },
  action_required: {
    label: 'Action Required',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: AlertTriangle,
  },
  ai_resolving: {
    label: 'Agentic Handling',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Clock,
  },
  completed: {
    label: 'Completed',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle,
  },
};

export function OrderDetails({ order }: OrderDetailsProps) {
  const config = statusConfig[order.status];
  const orderDate = new Date(order.createdAt).toLocaleString();

  return (
    <Card className="border-0 shadow-none rounded-none">
      <CardHeader className="pb-3 px-0">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="mb-2">{order.orderNumber}</CardTitle>
            <Badge variant="outline" className={`${config.color} rounded-full`}>
              {config.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <ScrollArea className="h-full">
          <div className="space-y-4">
            {/* Customer & Delivery Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-600 text-sm">
                  <Package className="w-4 h-4" />
                  <span>Customer</span>
                </div>
                <p className="pl-6">{order.customer}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-600 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>Destination</span>
                </div>
                <p className="pl-6">{order.destination}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-600 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>Created</span>
                </div>
                <p className="pl-6 text-sm">{orderDate}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-600 text-sm">
                  <DollarSign className="w-4 h-4" />
                  <span>Total Value</span>
                </div>
                <p className="pl-6">€{order.totalValue.toLocaleString()}</p>
              </div>
            </div>

            <Separator />

            {/* Order Items */}
            <div>
              <h4 className="mb-3 text-slate-600">Order Items</h4>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p>{item.name}</p>
                      <p className="text-sm text-slate-600">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p>Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes or AI Summary */}
            {(order.notes || order.aiSummary) && (
              <>
                <Separator />
                <div>
                  <h4 className="mb-2 text-slate-600">
                    {order.aiSummary ? 'AI Summary' : 'Notes'}
                  </h4>
                  <div className={`p-3 rounded-lg ${order.aiSummary ? 'bg-teal-50 border border-teal-100' : 'bg-slate-50'}`}>
                    <p className="text-sm">{order.aiSummary || order.notes}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}