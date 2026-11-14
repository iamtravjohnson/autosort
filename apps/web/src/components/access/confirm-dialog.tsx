'use client';

import { useActionState, useId, useRef, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

export type ConfirmState = { ok?: boolean; error?: string } | null;

/**
 * A button that opens a confirm dialog (a bottom sheet on phones) before running a
 * destructive server action. `confirmText` adds a required "I understand" checkbox.
 */
export function ConfirmDialog({
  trigger,
  triggerClassName,
  title,
  children,
  confirmLabel,
  pendingLabel,
  action,
  fields = {},
  confirmText,
}: {
  trigger: ReactNode;
  triggerClassName: string;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  action: (prev: ConfirmState, formData: FormData) => Promise<ConfirmState>;
  fields?: Record<string, string>;
  confirmText?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [state, formAction] = useActionState(action, null);

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => ref.current?.showModal()}>
        {trigger}
      </button>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        className="m-auto w-[min(480px,calc(100vw-32px))] max-w-none rounded-panel border-0 bg-surface-2 p-0 text-text-1 shadow-e3 backdrop:bg-black/60 max-sm:mb-0 max-sm:w-full max-sm:rounded-b-none max-sm:shadow-[0_-24px_64px_rgba(0,0,0,0.65)]"
      >
        <form action={formAction} className="flex flex-col gap-4 p-6 pb-[max(24px,env(safe-area-inset-bottom))]">
          {Object.entries(fields).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <h2 id={titleId} className="m-0 text-[20px] font-extrabold leading-[1.2] tracking-[-0.01em]">
            {title}
          </h2>
          <div className="flex flex-col gap-3 text-[14px] leading-[1.55] text-text-2">{children}</div>
          {confirmText ? (
            <label className="flex items-start gap-2.5 text-[14px] font-semibold">
              <input type="checkbox" name="confirm" value="yes" required className="mt-0.5 size-5 shrink-0 accent-accent" />
              {confirmText}
            </label>
          ) : (
            <input type="hidden" name="confirm" value="yes" />
          )}
          {state?.error ? (
            <p role="alert" className="m-0 rounded-card bg-error/[0.14] px-3 py-2 text-[14px] text-error-text">
              {state.error}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="inline-flex h-11 items-center justify-center rounded-pill px-5 text-[14px] font-semibold text-text-2 hover:text-text-1"
            >
              Cancel
            </button>
            <DangerSubmit label={confirmLabel} pendingLabel={pendingLabel} />
          </div>
        </form>
      </dialog>
    </>
  );
}

function DangerSubmit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-pill bg-[#7F1D1D] px-5 text-[14px] font-bold text-white transition-colors duration-[120ms] hover:bg-[#991B1B] disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

/** Submit button with a pending label (for small forms like "Revoke"). */
export function SubmitButton({ children, pendingLabel, className = '' }: { children: ReactNode; pendingLabel: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:cursor-wait disabled:opacity-70`}>
      {pending ? pendingLabel : children}
    </button>
  );
}
