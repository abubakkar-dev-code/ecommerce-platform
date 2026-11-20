import { useRef } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { FiArchive, FiBox, FiGrid, FiLayers, FiList, FiMenu, FiSettings, FiTag } from "react-icons/fi";

const links = [
  { path: "/", name: "Dashboard", icon: FiGrid }, { path: "/products", name: "Products", icon: FiBox },
  { path: "/categories", name: "Categories", icon: FiLayers }, { path: "/brands", name: "Brands", icon: FiTag },
  { path: "/inventory", name: "Inventory", icon: FiArchive }, { path: "/orders", name: "Orders", icon: FiList },
  { path: "/settings", name: "Settings", icon: FiSettings },
];

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  return <nav aria-label="Admin navigation" className="grid gap-1.5">
    {links.map(({ path, name, icon: Icon }) => <NavLink key={path} to={path} end={path === "/"} onClick={onNavigate}
      className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-violet-100 hover:bg-white/10 aria-[current=page]:bg-white aria-[current=page]:text-[#211732]">
      <Icon aria-hidden="true" />{name}
    </NavLink>)}
  </nav>;
}

export default function MainLayout() {
  const drawer = useRef<HTMLDialogElement>(null);
  const { pathname } = useLocation();
  const current = links.find((link) => link.path === "/" ? pathname === "/" : pathname.toLowerCase().startsWith(link.path));

  return <div className="mx-auto grid min-h-dvh w-full max-w-[94rem] gap-4 p-4 md:grid-cols-[14rem_minmax(0,1fr)] lg:gap-7 lg:p-6">
    <aside className="hidden self-start rounded-3xl bg-[#211732] p-4 text-white md:sticky md:top-4 md:block">
      <Link to="/" className="mb-7 flex items-center gap-2 rounded-xl px-2 py-2 text-lg font-extrabold tracking-tight">
        <span className="rounded-lg bg-[#d8ccff] p-2 text-[#211732]"><FiBox aria-hidden="true" /></span>Nexora Admin
      </Link>
      <Navigation />
    </aside>
    <div className="min-w-0 space-y-5">
      <header className="admin-panel flex items-center gap-3">
        <button type="button" aria-label="Open admin menu" aria-haspopup="dialog" onClick={() => drawer.current?.showModal()}
          className="rounded-xl border border-border p-3 text-primary md:hidden"><FiMenu aria-hidden="true" /></button>
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
          <Link to="/" className="font-semibold text-primary hover:underline">Workspace</Link>
          {current && <><span aria-hidden="true">/</span><span className="font-semibold text-text">{current.name}</span></>}
        </nav>
      </header>
      <main id="admin-content" tabIndex={-1} className="min-w-0"><Outlet /></main>
    </div>
    <dialog ref={drawer} aria-label="Admin menu"
      className="fixed inset-y-0 left-0 right-auto m-0 h-dvh max-h-none w-[min(85vw,19rem)] max-w-none bg-[#211732] p-5 text-white backdrop:bg-violet-950/45">
      <div className="mb-5 flex items-center justify-between gap-3"><p className="font-extrabold">Nexora Admin</p>
        <form method="dialog"><button className="rounded-lg border border-white/30 px-3 py-2">Close</button></form></div>
      <Navigation onNavigate={() => drawer.current?.close()} />
    </dialog>
  </div>;
}
