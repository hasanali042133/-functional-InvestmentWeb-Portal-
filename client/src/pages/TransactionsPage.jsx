import { useState } from 'react';
import * as investmentsApi from '@/api/investments.api.js';
import { useApi } from '@/hooks/useApi.js';
import { PageHeader } from '@/components/layout/PageHeader.jsx';
import { Card, CardFooter } from '@/components/ui/Card.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { TransactionsTable } from '@/components/dashboard/TransactionsTable.jsx';
import { ErrorState, Skeleton } from '@/components/ui/States.jsx';

const PAGE_SIZE = 10;

export default function TransactionsPage() {
  const [page, setPage] = useState(1);

  const { data, error, isLoading, refetch } = useApi(
    () => investmentsApi.listTransactions({ page, limit: PAGE_SIZE }),
    [page],
  );

  const transactions = data?.transactions ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <>
      <PageHeader
        title="Transactions"
        description="Every investment recorded on your account."
      />

      <Card>
        {isLoading && (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        )}

        {!isLoading && error && <ErrorState error={error} onRetry={refetch} />}

        {!isLoading && !error && <TransactionsTable transactions={transactions} />}

        {!isLoading && !error && totalPages > 1 && (
          <CardFooter className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Page <span className="font-semibold text-slate-900">{pagination.page}</span> of{' '}
              {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </>
  );
}
