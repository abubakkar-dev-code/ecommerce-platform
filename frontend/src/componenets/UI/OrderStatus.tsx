const colors: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-800", confirmed: "bg-emerald-50 text-emerald-800", delivered: "bg-emerald-50 text-emerald-800",
  pending: "bg-amber-50 text-amber-900", payment_review: "bg-amber-50 text-amber-900",
  failed: "bg-rose-50 text-rose-800", cancelled: "bg-rose-50 text-rose-800", expired: "bg-rose-50 text-rose-800",
  refunded: "bg-violet-100 text-violet-900",
};

export default function OrderStatus({ status, label }: { status: string; label?: string }) {
  return <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${colors[status] ?? "bg-surface text-text"}`}>
    {label && `${label} · `}{status.replaceAll("_", " ")}
  </span>;
}
