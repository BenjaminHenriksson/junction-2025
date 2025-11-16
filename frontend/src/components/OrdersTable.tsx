import { Order, OrderStatus } from "../types/order";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useState } from "react";

interface OrdersTableProps {
  orders: Order[];
  selectedOrderId?: string;
  onSelectOrder: (order: Order) => void;
  statusFilter: OrderStatus | "all";
  onStatusFilterChange: (status: OrderStatus | "all") => void;
}

const statusConfig = {
  support_required: {
    label: "Support Requested",
    color: "bg-orange-50 text-orange-700 border-orange-200",
    rowColor: "bg-orange-50/70",
    icon: AlertCircle,
    sortOrder: 0,
  },
  action_required: {
    label: "Action Required",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    rowColor: "bg-amber-50/70",
    icon: AlertTriangle,
    sortOrder: 1,
  },
  ai_resolving: {
    label: "Agentic Handling",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    rowColor: "bg-blue-50/70",
    icon: Clock,
    sortOrder: 2,
  },
  completed: {
    label: "Completed",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rowColor: "bg-emerald-50/70",
    icon: CheckCircle,
    sortOrder: 3,
  },
};

type SortColumn = "orderNumber" | "customer" | "destination" | "status" | "value";
type SortDirection = "asc" | "desc" | null;

export function OrdersTable({
  orders,
  selectedOrderId,
  onSelectOrder,
  statusFilter,
  onStatusFilterChange,
}: OrdersTableProps) {
  const [sortColumn, setSortColumn] =
    useState<SortColumn | null>("status");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("asc");

  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((order) => order.status === statusFilter);

  const getStatusCount = (status: OrderStatus | "all") => {
    if (status === "all") return orders.length;
    return orders.filter((order) => order.status === status)
      .length;
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction: asc -> desc -> null -> asc
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0;

    let comparison = 0;

    switch (sortColumn) {
      case "orderNumber":
        comparison = a.orderNumber.localeCompare(b.orderNumber);
        break;
      case "customer":
        comparison = a.customer.localeCompare(b.customer);
        break;
      case "destination":
        comparison = a.destination.localeCompare(b.destination);
        break;
      case "status":
        comparison =
          statusConfig[a.status].sortOrder -
          statusConfig[b.status].sortOrder;
        break;
      case "value":
        comparison = a.totalValue - b.totalValue;
        break;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return (
        <ArrowUpDown className="w-4 h-4 ml-1 text-slate-400" />
      );
    }
    if (sortDirection === "asc") {
      return (
        <ArrowUp className="w-4 h-4 ml-1 text-slate-700" />
      );
    }
    return (
      <ArrowDown className="w-4 h-4 ml-1 text-slate-700" />
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b bg-white">
        <h2 className="mb-4">Orders Management</h2>
        <Tabs
          value={statusFilter}
          onValueChange={(value) =>
            onStatusFilterChange(value as OrderStatus | "all")
          }
        >
          <TabsList className="grid w-full grid-cols-5 h-11">
            <TabsTrigger value="all" className="text-xs">
              All <span className="ml-1">({getStatusCount("all")})</span>
            </TabsTrigger>
            <TabsTrigger value="support_required" className="text-xs">
              Support Requested <span className="ml-1">({getStatusCount("support_required")})</span>
            </TabsTrigger>
            <TabsTrigger value="action_required" className="text-xs">
              Action Required <span className="ml-1">({getStatusCount("action_required")})</span>
            </TabsTrigger>
            <TabsTrigger value="ai_resolving" className="text-xs">
              AI Agent Dispatched <span className="ml-1">({getStatusCount("ai_resolving")})</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">
              Done <span className="ml-1">({getStatusCount("completed")})</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>
                <button
                  onClick={() => handleSort("orderNumber")}
                  className="flex items-center hover:text-slate-900 transition-colors text-xs"
                >
                  Order #
                  <SortIcon column="orderNumber" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("customer")}
                  className="flex items-center hover:text-slate-900 transition-colors text-xs"
                >
                  Customer
                  <SortIcon column="customer" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("destination")}
                  className="flex items-center hover:text-slate-900 transition-colors text-xs"
                >
                  Destination
                  <SortIcon column="destination" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("status")}
                  className="flex items-center hover:text-slate-900 transition-colors text-xs"
                >
                  Status
                  <SortIcon column="status" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => handleSort("value")}
                  className="flex items-center ml-auto hover:text-slate-900 transition-colors text-xs"
                >
                  Value
                  <SortIcon column="value" />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOrders.map((order) => {
              const config = statusConfig[order.status];
              const StatusIcon = config.icon;

              return (
                <TableRow
                  key={order.id}
                  className={`cursor-pointer transition-colors ${config.rowColor} ${
                    selectedOrderId === order.id
                      ? "ring-2 ring-[#0D6672] ring-inset"
                      : "hover:opacity-80"
                  }`}
                  onClick={() => onSelectOrder(order)}
                >
                  <TableCell className="text-[#0D6672]">{order.orderNumber}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.destination}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${config.color} rounded-full`}
                    >
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    €{order.totalValue.toLocaleString()}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}