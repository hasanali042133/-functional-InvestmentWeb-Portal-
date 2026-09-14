import { useApi } from '@/hooks/useApi.js';
import * as productsApi from '@/api/products.api.js';
import { PageHeader } from '@/components/layout/PageHeader.jsx';
import { ProductCard } from '@/components/products/ProductCard.jsx';
import { Card } from '@/components/ui/Card.jsx';
import { Skeleton, EmptyState, ErrorState } from '@/components/ui/States.jsx';

function ProductCardSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    </Card>
  );
}

export default function ProductsPage() {
  const { data, error, isLoading, refetch } = useApi(() => productsApi.listProducts(), []);
  const products = data?.products ?? [];

  return (
    <>
      <PageHeader
        title="Investment products"
        description="Funds ordered from lowest to highest risk. Every fund shows its own price history."
      />

      {isLoading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <Card>
          <ErrorState error={error} onRetry={refetch} />
        </Card>
      )}

      {!isLoading && !error && products.length === 0 && (
        <Card>
          <EmptyState
            title="No products available"
            description="There are no investment products to show right now. Please check back shortly."
          />
        </Card>
      )}

      {!isLoading && !error && products.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}
