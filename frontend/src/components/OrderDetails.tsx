import { useState, useEffect } from 'react';
import { Order } from '../types/order';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { Package, MapPin, Calendar, DollarSign, TrendingUp, Loader2, Sparkles } from 'lucide-react';
import { AlertCircle, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { statsApi, PredictionResponse } from '../services/api';
import { dbApi } from '../services/api';
import { SimilarProduct } from '../types/product';

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
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [selectedItemSku, setSelectedItemSku] = useState<string | null>(null);
  const [similarProducts, setSimilarProducts] = useState<SimilarProduct[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  useEffect(() => {
    if (selectedItemSku) {
      loadSimilarProducts(selectedItemSku);
    } else {
      setSimilarProducts([]);
    }
  }, [selectedItemSku]);

  const loadSimilarProducts = async (sku: string) => {
    try {
      setLoadingSimilar(true);
      // Try to get product by GTIN (assuming SKU might be GTIN)
      try {
        const product = await dbApi.getProduct(sku);
        const similar = await dbApi.getSimilarProducts(product.gtin, 5);
        setSimilarProducts(similar);
      } catch {
        // If SKU is not a valid GTIN, try searching
        const results = await dbApi.searchProducts(sku, 1);
        if (results.length > 0) {
          const similar = await dbApi.getSimilarProducts(results[0].gtin, 5);
          setSimilarProducts(similar);
        } else {
          setSimilarProducts([]);
        }
      }
    } catch (err) {
      console.error('Error loading similar products:', err);
      setSimilarProducts([]);
    } finally {
      setLoadingSimilar(false);
    }
  };

  const handlePredict = async () => {
    setLoadingPrediction(true);
    setPredictionError(null);
    
    try {
      // Use actual order data if available, otherwise use defaults
      const orderAny = order as any;
      const predictionRequest = order.items.map((item) => {
        // Extract day of week from date
        const orderDate = new Date(order.createdAt);
        const orderDow = orderDate.toLocaleDateString('en-US', { weekday: 'short' });
        
        return {
          product_code: orderAny.product_code || item.sku || 'other',
          order_qty: orderAny.order_qty || item.quantity,
          sales_unit: orderAny.sales_unit || 'PAK',
          plant: orderAny.plant || '30588',
          storage_location: orderAny.storage_location || '2001',
          order_dow: orderAny.order_dow || orderDow,
          delivery_dow: orderAny.delivery_dow || 'Wed',
          lead_time: orderAny.lead_time || 2,
          month: orderAny.month || orderDate.toLocaleDateString('en-US', { month: '2-digit' }),
          coinciding_delivery: orderAny.coinciding_delivery || '0',
        };
      });

      const result = await statsApi.predict(predictionRequest);
      setPrediction(result);
    } catch (err) {
      setPredictionError(err instanceof Error ? err.message : 'Failed to get prediction');
      console.error('Prediction error:', err);
    } finally {
      setLoadingPrediction(false);
    }
  };

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
                  <div 
                    key={item.id} 
                    className={`flex justify-between items-start p-3 rounded-lg transition-colors cursor-pointer ${
                      selectedItemSku === item.sku 
                        ? 'bg-[#0D6672]/10 border-2 border-[#0D6672]' 
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                    onClick={() => setSelectedItemSku(selectedItemSku === item.sku ? null : item.sku)}
                  >
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

            {/* Similar Products for Selected Item */}
            {selectedItemSku && (
              <>
                <Separator />
                <div>
                  <h4 className="mb-2 text-slate-600 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#0D6672]" />
                    Similar Products
                  </h4>
                  {loadingSimilar ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-[#0D6672]" />
                    </div>
                  ) : similarProducts.length > 0 ? (
                    <div className="space-y-2">
                      {similarProducts.map((similar) => (
                        <div
                          key={similar.gtin}
                          className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{similar.name}</p>
                              <p className="text-xs text-slate-500">GTIN: {similar.gtin}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {(similar.similarity * 100).toFixed(0)}% match
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No similar products found</p>
                  )}
                </div>
              </>
            )}

            {/* Prediction Section */}
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-slate-600 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Failure Prediction
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePredict}
                  disabled={loadingPrediction}
                  className="text-xs"
                >
                  {loadingPrediction ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Predicting...
                    </>
                  ) : (
                    'Get Prediction'
                  )}
                </Button>
              </div>
              
              {predictionError && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 mb-2">
                  {predictionError}
                </div>
              )}

              {prediction && (
                <div className="p-3 bg-teal-50 border border-teal-100 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Predictions:</span>
                      <Badge variant="outline" className="bg-white">
                        {prediction.n} item{prediction.n !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {prediction.predictions.map((pred, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span>Item {idx + 1}:</span>
                          <div className="flex items-center gap-2">
                            <span className={pred.prob_failure >= 0.5 ? 'text-red-600 font-medium' : 'text-green-600'}>
                              {(pred.prob_failure * 100).toFixed(1)}% failure risk
                            </span>
                            {pred.predicted_failure === 1 && (
                              <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-xs">
                                High Risk
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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
