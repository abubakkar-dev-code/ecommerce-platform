import { useEffect, useRef, type ReactNode } from "react";

export default function Drawer({ label, title, children, closeAt }: { label: ReactNode; title: string; children: ReactNode; closeAt: number }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const desktop = window.matchMedia(`(min-width: ${closeAt}px)`);
    const close = () => { if (desktop.matches && dialog.current?.open) dialog.current.close(); };
    desktop.addEventListener("change", close);
    return () => desktop.removeEventListener("change", close);
  }, [closeAt]);
  return <>
    <button type="button" className="store-secondary" aria-haspopup="dialog" aria-label={title}
      onClick={() => dialog.current?.showModal()}>{label}</button>
    <dialog ref={dialog} aria-label={title}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-[min(90vw,25rem)] max-w-none overflow-y-auto border-l border-border bg-white p-5 text-text shadow-xl backdrop:bg-violet-950/45"
      onClick={(event) => { if ((event.target as HTMLElement).closest("a")) dialog.current?.close(); }}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{title}</h2>
        <form method="dialog"><button className="store-secondary" type="submit">Close</button></form>
      </div>
      {children}
    </dialog>
  </>;
}
