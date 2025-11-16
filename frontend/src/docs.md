# B2B Operations Dashboard - Frontend Documentation

## Overview

B2B operations dashboard for delivery company operations managers with three main views:

1. **Dashboard** - Risk threshold configuration only
2. **Order Management** - Order monitoring with AI chat interface  
3. **Inventory Management** - Stock tracking across warehouses

**Design**: Teal color scheme (#0D6672), pill-shaped tabs, rounded badges, professional B2B styling

---

## Technology Stack

- **React 18+ with TypeScript**
- **Tailwind CSS v4.0** (configured in `/styles/globals.css`)
- **Shadcn/ui components** (`/components/ui/`)
- **Lucide React** (icons)
- **Recharts** (if needed for future charts)

---

## Data Models

See `/types/order.ts` for complete TypeScript definitions:

```typescript
// Order statuses
type OrderStatus = 'support_required' | 'action_required' | 'ai_resolving' | 'completed';

// Main interfaces
interface Order { /* see /types/order.ts */ }
interface OrderItem { /* see /types/order.ts */ }
interface ChatMessage { /* see /types/order.ts */ }
```

See `/components/InventoryManagement.tsx` (lines 13-22) for inventory item interface.

---

## Current State (Mock Data)

All data is currently **static/mock**:
- Orders: `/data/mockOrders.ts`
- Inventory: Mock data in `/components/InventoryManagement.tsx`
- Chat messages: Generated based on order status in `/components/ChatInterface.tsx`

**No API calls or backend connections exist yet.**

---

## Components & Integration Points

### 1. App.tsx
**State**: `viewMode`, `selectedOrder`, `statusFilter`  
**TODO**: Replace `mockOrders` import with API call

### 2. Dashboard.tsx
**Purpose**: Risk threshold configuration only  
**State**: `agentThreshold` (default: 85%), `manualThreshold` (default: 65%)  
**TODO**: 
- `handleSave()` - POST thresholds to backend
- Load current thresholds from backend on mount

### 3. OrdersTable.tsx
**Purpose**: Display and filter orders  
**TODO**: 
- Fetch orders from backend with pagination
- Implement search/filter on backend
- Add real-time updates via WebSocket

### 4. OrderDetails.tsx
**Purpose**: Show single order details  
**TODO**: No changes needed, just pass order from API

### 5. ChatInterface.tsx
**Purpose**: Real-time chat with AI agents  
**Current**: Simulated responses with 1s delay  
**TODO**:
- Replace `generateMessagesByStatus()` with API call for message history
- Replace `handleSend()` setTimeout with WebSocket message send
- Connect to WebSocket for real-time messages

### 6. InventoryManagement.tsx
**Purpose**: Track inventory across warehouses  
**TODO**:
- Fetch inventory from backend
- Implement search/filter on backend
- Add real-time stock updates via WebSocket

---

## Backend Integration Requirements

### Use Server Data Schema
**DO NOT** create custom schemas. Use whatever data models/schemas are defined in the server filesystem. Adapt the frontend TypeScript interfaces to match the backend schema exactly.

### Required API Endpoints (Minimum)

```
# Authentication
POST   /api/auth/login
GET    /api/auth/me

# Orders
GET    /api/orders
GET    /api/orders/:id
PUT    /api/orders/:id

# Chat
GET    /api/orders/:id/messages
POST   /api/orders/:id/messages

# Dashboard
GET    /api/config/thresholds
PUT    /api/config/thresholds

# Inventory
GET    /api/inventory
PUT    /api/inventory/:id
```

### WebSocket Connections (Recommended)

```
ws://api/orders/stream        # Real-time order updates
ws://api/orders/:id/chat      # Real-time chat messages
ws://api/inventory/stream     # Real-time inventory updates
```

---

## Risk Threshold Logic

The system uses risk scores (0-100) to determine handling:

- **≥ Agent Threshold (default 85%)**: AI agent automatically dispatched
- **Manual Threshold to Agent Threshold (default 65-84%)**: Manual review required  
- **< Manual Threshold (default <65%)**: No action needed

Backend should calculate risk scores based on order issues. Frontend only displays and configures the thresholds.

---

## Migration Steps

### Step 1: Replace Mock Orders
**File**: `/App.tsx`  
**Change**: Replace `import { mockOrders } from './data/mockOrders'` with API call

### Step 2: Connect Chat
**File**: `/components/ChatInterface.tsx`  
**Change**: 
- Remove `generateMessagesByStatus()` 
- Fetch messages from API on mount
- Replace setTimeout in `handleSend()` with WebSocket send

### Step 3: Connect Dashboard
**File**: `/components/Dashboard.tsx`  
**Change**:
- Load thresholds from `GET /api/config/thresholds` on mount
- POST to backend in `handleSave()`

### Step 4: Connect Inventory  
**File**: `/components/InventoryManagement.tsx`  
**Change**: Replace `mockInventory` with API call

---

## State Management (Recommended)

Use **React Query** for API calls:

```typescript
// Example
import { useQuery } from '@tanstack/react-query';

export function useOrders(statusFilter: string) {
  return useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: () => fetch(`/api/orders?status=${statusFilter}`).then(r => r.json()),
  });
}
```

---

## Authentication

**TODO**: Wrap App.tsx with auth provider that:
1. Checks for valid session/token
2. Redirects to login if not authenticated  
3. Adds auth headers to all API requests

---

## Real-time Updates

**Recommended approach**:
1. Establish WebSocket connection on mount
2. Listen for events (`order:updated`, `message:new`, etc.)
3. Update React Query cache or local state on events
4. Show connection status in UI

---

## Testing

Before backend integration:
- Use existing mock data
- Test all UI interactions locally
- Verify filtering, search, tab switching

After backend integration:
- Test with real API responses
- Verify WebSocket reconnection
- Test error handling (network failures, etc.)

---

## Important Notes

1. **Use server data schema** - Do not invent your own. Adapt frontend to match backend.
2. **No custom database design** - Backend owns the schema.
3. **Minimal docs** - This is intentionally brief. Check component files for specifics.
4. **All existing mock data is for reference** - Shows expected data shape but backend may differ.

---

## Component File Reference

- Main app: `/App.tsx`
- Types: `/types/order.ts`
- Mock data: `/data/mockOrders.ts`
- Dashboard: `/components/Dashboard.tsx`
- Orders: `/components/OrdersTable.tsx`, `/components/OrderDetails.tsx`
- Chat: `/components/ChatInterface.tsx`
- Inventory: `/components/InventoryManagement.tsx`
- UI components: `/components/ui/*`

**Last Updated**: November 16, 2025
