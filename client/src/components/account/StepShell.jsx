import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/Card.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Alert } from '@/components/ui/Alert.jsx';

/**
 * Shared frame for every step: title, body, and the same navigation controls in
 * the same place, so moving through the form feels like one continuous flow.
 */
export function StepShell({
  title,
  description,
  error,
  blockedReasons = [],
  onBack,
  onSubmit,
  isSaving,
  submitLabel = 'Save and continue',
  backLabel = 'Back',
  canSubmit = true,
  children,
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} />

      <form onSubmit={onSubmit} noValidate>
        <CardBody className="space-y-6">
          {error && <Alert variant="error">{error}</Alert>}

          {/* Anything stopping the step, listed where it cannot be missed. A
              message beside its field is better — but only when that field is
              actually on screen. */}
          {blockedReasons.length > 0 && (
            <Alert variant="error" title="This step is not complete yet">
              <ul className="list-disc space-y-0.5 pl-4">
                {blockedReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </Alert>
          )}

          {children}
        </CardBody>

        <CardFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          {onBack ? (
            <Button type="button" variant="secondary" onClick={onBack} disabled={isSaving}>
              {backLabel}
            </Button>
          ) : (
            <span className="hidden sm:block" />
          )}

          <Button type="submit" loading={isSaving} disabled={!canSubmit}>
            {isSaving ? 'Saving' : submitLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
