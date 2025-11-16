import { useState, useEffect } from 'react';
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
  Sparkles,
  Loader2
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { dbApi } from '../services/api';
import { ProductResponse, SimilarProduct } from '../types/product';

export function InventoryManagement() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);
  const [similarProducts, setSimilarProducts] = useState<SimilarProduct[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadSimilarProducts(selectedProduct.gtin);
    } else {
      setSimilarProducts([]);
    }
  }, [selectedProduct]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dbApi.getProducts(200);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSimilarProducts = async (gtin: string) => {
    try {
      setLoadingSimilar(true);
      const similar = await dbApi.getSimilarProducts(gtin, 10);
      setSimilarProducts(similar);
    } catch (err) {
      console.error('Error loading similar products:', err);
      setSimilarProducts([]);
    } finally {
      setLoadingSimilar(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadProducts();
      return;
    }
    try {
      setLoading(true);
      const results = await dbApi.searchProducts(searchQuery, 50);
      setProducts(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      console.error('Error searching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (product: ProductResponse) => {
    return product.name || 'Unknown Product';
  };

  const getProductVendor = (product: ProductResponse) => {
    return product.product_data.vendorName || 'Unknown Vendor';
  };

  const getProductCategory = (product: ProductResponse) => {
    return product.product_data.category || 'N/A';
  };

  const getProductWeight = (product: ProductResponse) => {
    const conversions = product.product_data.synkkaData?.unitConversions;
    if (conversions && conversions.length > 0) {
      const netWeight = conversions[0].netWeight;
      if (netWeight) {
        return `${netWeight.value} ${netWeight.unit}`;
      }
    }
    return 'N/A';
  };

  const filteredProducts = products.filter((product) => {
    const name = getProductName(product).toLowerCase();
    const gtin = product.gtin.toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || gtin.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="h-full flex overflow-hidden bg-slate-50">
      {/* Left Panel - Products List */}
      <div className="w-[60%] border-r bg-white flex flex-col">
        <Card className="border-0 shadow-none rounded-none border-b">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Product Catalog</CardTitle>
                <CardDescription>Browse products and find similar items</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadProducts}>
                  <Download className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search products by name or GTIN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="pl-10"
                />
              </div>
              <Button 
                onClick={handleSearch}
                className="bg-[#0D6672] hover:bg-[#0a5259]"
              >
                Search
              </Button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-[#0D6672]" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>GTIN</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Weight</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow
                      key={product.gtin}
                      className={`cursor-pointer transition-colors ${
                        selectedProduct?.gtin === product.gtin
                          ? 'bg-[#0D6672]/10 ring-2 ring-[#0D6672] ring-inset'
                          : 'hover:bg-slate-50'
                      }`}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <TableCell className="font-medium">
                        {getProductName(product)}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {product.gtin}
                      </TableCell>
                      <TableCell>{getProductVendor(product)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getProductCategory(product)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {getProductWeight(product)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Right Panel - Product Details & Similar Products */}
      <div className="w-[40%] flex flex-col bg-white">
        {selectedProduct ? (
          <>
            {/* Product Details - Top Half */}
            <div className="h-[50%] overflow-auto border-b p-6">
              <Card className="border-0 shadow-none">
                <CardHeader className="pb-3 px-0">
                  <CardTitle className="mb-2">{getProductName(selectedProduct)}</CardTitle>
                  <Badge variant="outline" className="w-fit">
                    GTIN: {selectedProduct.gtin}
                  </Badge>
                </CardHeader>
                <CardContent className="px-0">
                  <ScrollArea className="h-full">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-slate-600 text-sm">
                            <Package className="w-4 h-4" />
                            <span>Vendor</span>
                          </div>
                          <p className="pl-6">{getProductVendor(selectedProduct)}</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-slate-600 text-sm">
                            <MapPin className="w-4 h-4" />
                            <span>Origin</span>
                          </div>
                          <p className="pl-6">
                            {selectedProduct.product_data.countryOfOrigin || 'N/A'}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="mb-2 text-slate-600 text-sm font-medium">Product Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Category:</span>
                            <span>{getProductCategory(selectedProduct)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Weight:</span>
                            <span>{getProductWeight(selectedProduct)}</span>
                          </div>
                          {selectedProduct.product_data.synkkaData?.brand && (
                            <div className="flex justify-between">
                              <span className="text-slate-600">Brand:</span>
                              <span>{selectedProduct.product_data.synkkaData.brand}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {selectedProduct.product_data.synkkaData?.marketingTexts?.[0]?.value && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="mb-2 text-slate-600 text-sm font-medium">Description</h4>
                            <p className="text-sm text-slate-700">
                              {selectedProduct.product_data.synkkaData.marketingTexts[0].value}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Similar Products - Bottom Half */}
            <div className="h-[50%] overflow-hidden p-6">
              <Card className="border-0 shadow-none h-full flex flex-col">
                <CardHeader className="pb-3 px-0">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#0D6672]" />
                    Similar Products
                  </CardTitle>
                  <CardDescription>
                    Products with similar characteristics based on vector similarity
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 flex-1 overflow-hidden">
                  {loadingSimilar ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin text-[#0D6672]" />
                    </div>
                  ) : similarProducts.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                      No similar products found
                    </div>
                  ) : (
                    <ScrollArea className="h-full">
                      <div className="space-y-3">
                        {similarProducts.map((similar) => (
                          <div
                            key={similar.gtin}
                            className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#0D6672] transition-colors cursor-pointer"
                            onClick={() => setSelectedProduct({
                              gtin: similar.gtin,
                              name: similar.name,
                              product_data: similar.product_data
                            })}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{similar.name}</p>
                                <p className="text-xs text-slate-500 mt-1">GTIN: {similar.gtin}</p>
                              </div>
                              <Badge 
                                variant="outline" 
                                className="bg-[#0D6672]/10 text-[#0D6672] border-[#0D6672]/20"
                              >
                                {(similar.similarity * 100).toFixed(1)}% match
                              </Badge>
                            </div>
                            <div className="text-xs text-slate-600 mt-2">
                              <span className="font-medium">Vendor:</span> {getProductVendor({
                                gtin: similar.gtin,
                                name: similar.name,
                                product_data: similar.product_data
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">Select a product to view details and similar products</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
