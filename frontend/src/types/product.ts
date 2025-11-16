// Product data types based on the Valio product schema

export interface ProductName {
  value: string;
  language: string;
}

export interface ProductMedia {
  id: number;
  primary: boolean;
}

export interface UnitConversion {
  synkkaPackagingType: string;
  width?: { unit: string; value: number };
  length?: { unit: string; value: number };
  height?: { unit: string; value: number };
  volume?: { unit: string; value: number };
  netWeight?: { unit: string; value: number };
  grossWeight?: { unit: string; value: number };
}

export interface ClassificationValue {
  id: string;
  value?: number;
  unit?: string;
  synkkaId?: string;
}

export interface Classification {
  type: string;
  name: string;
  values: ClassificationValue[];
}

export interface NutritionalContent {
  id: string;
  value: number;
  unit: string;
  unitPrecision?: string;
  basisQuantity?: number;
  basisQuantityUnit?: string;
  servingSize?: number;
  servingSizeUnit?: string;
}

export interface Ingredient {
  sequence: number;
  percentage?: number;
  names: ProductName[];
  origins?: Array<{ type: string; country: string }>;
}

export interface Producer {
  id: string;
  name: string;
}

export interface Unit {
  unitId: string;
  gtin: string;
  sizeInBaseUnits: number;
}

export interface SynkkaData {
  gtin: string;
  lastUpdated?: string;
  mediasLastUpdated?: string;
  countriesOfOrigin?: string[];
  names: ProductName[];
  materialAdditionalDescriptions?: any[];
  marketingTexts?: ProductName[];
  keyIngredients?: ProductName[];
  storageInstructions?: ProductName[];
  preparationInstructions?: ProductName[];
  disposalInformations?: ProductName[];
  usageInstructions?: ProductName[];
  classifications: Classification[];
  nutritionalContent?: NutritionalContent[];
  ingredients?: Ingredient[];
  medias?: ProductMedia[];
  children?: any[];
  fishingReports?: any[];
  safetyData?: any[];
  brand?: string;
  variableUnit?: boolean;
  vatCode?: string;
  producers?: Producer[];
  unitConversions?: UnitConversion[];
  minTemperature?: number;
  maxTemperature?: number;
}

export interface Product {
  salesUnitGtin?: string;
  salesUnit?: string;
  baseUnit?: string;
  category?: string;
  allowedLotSize?: number;
  deleted?: boolean;
  temperatureCondition?: number;
  vendorName?: string;
  countryOfOrigin?: string;
  synkkaData: SynkkaData;
  units?: Unit[];
  deposits?: any[];
  gtin?: string;
}

export interface ProductResponse {
  gtin: string;
  name: string;
  product_data: Product;
}

export interface SimilarProduct {
  gtin: string;
  name: string;
  similarity: number;
  product_data: Product;
}

export interface ProductSearchResult {
  gtin: string;
  name: string;
  product_data: Product;
}
