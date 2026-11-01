import {
  CircleCheck,
  CornerDownRight,
  Info,
  ListChecks,
  TriangleAlert,
} from 'lucide-react';
import { type FC, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import type { FieldIssue, IssueSeverity } from './edit-checks';
import type { CheckedEditField } from './use-edit-page';

import { applyFix, revealField } from './edit-fields';
import RulesDialog, { prefetchRules } from './rules-dialog';

const pluralRules = new Intl.PluralRules('uk');
const issuesWord = (count: number) =>
  pluralRules.select(count) === 'many' ? 'зауважень' : 'зауваження';

const SEVERITY_ICON: Record<IssueSeverity, FC<{ className?: string }>> = {
  error: TriangleAlert,
  warning: TriangleAlert,
  hint: Info,
};

const SEVERITY_CLASS: Record<IssueSeverity, string> = {
  error: 'text-destructive',
  warning: 'text-warning',
  hint: 'text-muted-foreground',
};

/** Hints don't count: an edit can go without them. */
const counts = (issue: FieldIssue) => issue.severity !== 'hint';

const IssueRow: FC<{ field: CheckedEditField; issue: FieldIssue }> = ({
  field,
  issue,
}) => {
  const Icon = SEVERITY_ICON[issue.severity];
  const { fix } = issue;
  return (
    <li className="flex items-start gap-2 px-2 py-1.5 text-sm">
      <Icon
        className={cn('mt-0.5 size-4 shrink-0', SEVERITY_CLASS[issue.severity])}
      />
      <span className="min-w-0 flex-1">{issue.message}</span>
      {field.editable && fix && (
        <Button
          variant="secondary"
          size="sm"
          className="-my-1"
          onClick={() => void applyFix(field, fix)}
        >
          Виправити
        </Button>
      )}
    </li>
  );
};

/**
 * "Перевірка": the open fields checked against hikka.io's editing rules,
 * each issue with the way to its field and, when certain, a fix.
 */
const ChecksPopover: FC<{
  fields: CheckedEditField[];
  container: HTMLElement;
}> = ({ fields: allFields, container }) => {
  const [open, setOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  // The comment alone is there before anything's being edited.
  const fields = allFields.some(({ group }) => group !== 'comment')
    ? allFields
    : [];
  const flagged = fields.filter((field) => field.issues.length > 0);
  const issues = fields.flatMap((field) => field.issues);
  const count = issues.filter(counts).length;
  const hasError = issues.some((issue) => issue.severity === 'error');

  const label = !fields.length
    ? 'Перевірка'
    : count
      ? `${count} ${issuesWord(count)}`
      : 'Без зауважень';
  const Icon = !fields.length
    ? ListChecks
    : count
      ? TriangleAlert
      : CircleCheck;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="md"
              className="gap-2"
              aria-label={label}
            />
          }
        >
          <Icon
            className={cn(
              count > 0 && (hasError ? 'text-destructive' : 'text-warning'),
            )}
          />
          {count > 0 && <span className="tabular-nums sm:hidden">{count}</span>}
          <span className="hidden sm:inline">{label}</span>
        </PopoverTrigger>
        <PopoverContent
          container={container}
          side="top"
          align="start"
          sideOffset={12}
          className="w-[min(22rem,calc(100vw-2rem))] gap-0 p-0 text-base"
        >
          <div className="flex items-center justify-between gap-4 px-4 pt-3 pb-2">
            <h2 className="font-semibold">Перевірка правки</h2>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setRulesOpen(true);
              }}
              onPointerEnter={prefetchRules}
              onFocus={prefetchRules}
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring cursor-pointer rounded-sm text-sm underline-offset-4 outline-none hover:underline focus-visible:ring-2"
            >
              Правила
            </button>
          </div>
          {flagged.length ? (
            <ul className="flex max-h-[min(24rem,50vh)] flex-col gap-2 overflow-y-auto px-2 pb-2">
              {flagged.map((field) => (
                <li key={field.name} className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      revealField(field);
                    }}
                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex cursor-pointer items-center gap-1.5 rounded-sm px-2 py-1 text-left text-xs font-medium outline-none focus-visible:ring-2"
                  >
                    <CornerDownRight className="size-3.5" />
                    {field.name}
                  </button>
                  <ul>
                    {field.issues.map((issue) => (
                      <IssueRow key={issue.rule} field={field} issue={issue} />
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground px-4 pb-4 text-sm">
              {fields.length
                ? 'Зауважень немає. Перевіряються літери, пробіли, оформлення сезонів і рядок із джерелом опису.'
                : 'Відкрийте поля, які редагуєте: перевіряються лише вони.'}
            </p>
          )}
        </PopoverContent>
      </Popover>
      <RulesDialog
        open={rulesOpen}
        onOpenChange={setRulesOpen}
        container={container}
      />
    </>
  );
};

export default ChecksPopover;
