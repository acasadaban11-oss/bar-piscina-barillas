import { useState, useCallback } from "react";
import { useProductos, useVentas, useMovimientos, useCategorias } from "./useFirebase";

const PIN_ADMIN    = "1234";
const PIN_CAMARERO = "0000";
const FECHA_HOY    = new Date().toLocaleDateString("es-ES");

function sclr(p) {
  if (p.stock === 0)         return "#ef4444";
  if (p.stock <= p.stockMin) return "#f59e0b";
  return "#10b981";
}

// ─── CAMPO EDITABLE INLINE ───────────────────────────────────
function IE({ value, onChange, type = "text", style = {}, suffix = "" }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value);

  if (!editing) return (
    <span
      onClick={(e) => { e.stopPropagation(); setV(value); setEditing(true); }}
      style={{ cursor: "text", borderBottom: "2px solid transparent", padding: "1px 3px",
        borderRadius: 3, transition: "border .15s", ...style }}
      onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = "#cbd5e1")}
      onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = "transparent")}
    >
      {type === "number" ? Number(value).toFixed(2) : value}{suffix}
    </span>
  );

  return (
    <input
      autoFocus
      type={type}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => { setEditing(false); const n = type === "number" ? parseFloat(v) || 0 : v; if (n !== value) onChange(n); }}
      onKeyDown={(e) => {
        if (e.key === "Enter") { setEditing(false); const n = type === "number" ? parseFloat(v) || 0 : v; onChange(n); }
        if (e.key === "Escape") setEditing(false);
      }}
      onClick={(e) => e.stopPropagation()}
      style={{ width: type === "number" ? 70 : 130, padding: "1px 5px", borderRadius: 4,
        border: "2px solid #0369a1", background: "#f0f9ff", fontSize: "inherit",
        fontWeight: "inherit", color: "inherit", fontFamily: "inherit", ...style }}
    />
  );
}

// ─── MODAL ───────────────────────────────────────────────────
function Modal({ onClose, title, children }) {
  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)",
        display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 999 }}>
      <div style={{ background: "white", borderRadius: "20px 20px 0 0", padding: "18px 16px 32px",
        width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#1e293b" }}>{title}</span>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "#f1f5f9", cursor: "pointer", fontSize: 16 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── PANTALLA DE LOGIN ────────────────────────────────────────
function Login({ onLogin }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);
  const digits = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

  const handle = (d) => {
    if (err) { setPin(""); setErr(false); }
    const n = pin + d;
    setPin(n);
    if (n.length === 4) {
      if (n === PIN_ADMIN)    { onLogin("admin");    return; }
      if (n === PIN_CAMARERO) { onLogin("camarero"); return; }
      setErr(true);
      setTimeout(() => { setPin(""); setErr(false); }, 700);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg,#0ea5e9,#0c4a6e)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 20, padding: "28px 24px",
        width: "100%", maxWidth: 320, boxShadow: "0 20px 50px rgba(0,0,0,.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 44, marginBottom: 6 }}>🏊</div>
          <div style={{ fontWeight: 800, fontSize: 22, color: "#0369a1" }}>Bar Las Varillas</div>
          <div style={{ color: "#64748b", fontSize: 13, marginTop: 3 }}>Introduce tu PIN</div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20 }}>
          {[0,1,2,3].map((i) => (
            <div key={i} style={{ width: 13, height: 13, borderRadius: "50%",
              background: err ? "#ef4444" : pin.length > i ? "#0369a1" : "#e2e8f0",
              transition: "all .15s" }} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          {digits.map((d, i) => (
            <button key={i}
              onClick={() => d === "⌫" ? setPin((p) => p.slice(0,-1)) : d !== "" && handle(d)}
              disabled={d === ""}
              style={{ height: 54, fontSize: d === "⌫" ? 20 : 22, fontWeight: 600,
                borderRadius: 11, border: "none",
                background: d === "" ? "transparent" : err ? "#fee2e2" : "#f1f5f9",
                color: err ? "#ef4444" : "#1e293b",
                cursor: d === "" ? "default" : "pointer" }}>
              {d}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: "7px 12px", background: "#f0f9ff",
          borderRadius: 8, fontSize: 11, color: "#64748b", textAlign: "center" }}>
          Admin: <b>1234</b> · Camarero: <b>0000</b>
        </div>
      </div>
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────
export default function App() {
  const [rol, setRol]             = useState(null);
  const [pant, setPant]           = useState("tpv");
  const [adminTab, setAdminTab]   = useState("caja");
  const [catAct, setCatAct]       = useState("Todo");
  const [comanda, setComanda]     = useState([]);
  const [desc, setDesc]           = useState(0);
  const [esInv, setEsInv]         = useState(false);
  const [pago, setPago]           = useState(null);
  const [showCobrar, setShowCobrar] = useState(false);
  const [ticket, setTicket]       = useState(null);
  const [showRep, setShowRep]     = useState(null);
  const [repCant, setRepCant]     = useState("");
  const [dragId, setDragId]       = useState(null);
  const [dragOver, setDragOver]   = useState(null);
  const [editCatIdx, setEditCatIdx] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [catEditorFiltro, setCatEditorFiltro] = useState("Todo");

  // Firebase hooks
  const { productos, actualizar, crear, eliminar, reordenar } = useProductos();
  const { ventas, registrar: registrarVenta }                 = useVentas();
  const { movimientos, registrar: registrarMov }             = useMovimientos();
  const { categorias, guardar: guardarCats }                 = useCategorias();

  if (!rol) return <Login onLogin={(r) => setRol(r)} />;

  const prodsActivos  = productos.filter((p) => p.activo).sort((a, b) => a.orden - b.orden);
  const prodsFilt     = catAct === "Todo" ? prodsActivos : prodsActivos.filter((p) => p.cat === catAct);
  const total         = comanda.reduce((s, i) => s + i.precio * i.qty, 0);
  const totalFinal    = esInv ? 0 : total * (1 - desc / 100);
  const alertas       = productos.filter((p) => p.stock <= p.stockMin && p.activo);

  const ventasHoy   = ventas.filter((v) => v.fecha === FECHA_HOY);
  const totHoy      = ventasHoy.filter((v) => !v.inv).reduce((s, v) => s + v.total, 0);
  const totEfec     = ventasHoy.filter((v) => !v.inv && v.pago === "efectivo").reduce((s, v) => s + v.total, 0);
  const totTarj     = ventasHoy.filter((v) => !v.inv && v.pago === "tarjeta").reduce((s, v) => s + v.total, 0);
  const totInv      = ventasHoy.filter((v) => v.inv).reduce((s, v) => s + (v.coste || 0), 0);

  const flash = () => { setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1400); };

  // Helpers comanda
  const addItem = (p) => {
    if (p.stock <= 0) return;
    setComanda((prev) => {
      const e = prev.find((i) => i.id === p.id);
      if (e) return prev.map((i) => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...p, qty: 1 }];
    });
  };
  const remItem = (id) => setComanda((prev) =>
    prev.map((i) => i.id === id ? { ...i, qty: Math.max(0, i.qty - 1) } : i).filter((i) => i.qty > 0)
  );
  const clearComanda = () => { setComanda([]); setDesc(0); setEsInv(false); setPago(null); };

  // Cobrar
  const cobrar = async () => {
    if (!esInv && !pago) return;
    const hora = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    const t = {
      fecha: FECHA_HOY, hora,
      items: comanda.map((i) => ({ nombre: i.nombre, precio: i.precio, qty: i.qty })),
      sub: total, desc, total: totalFinal,
      coste: comanda.reduce((s, i) => s + (i.coste || 0) * i.qty, 0),
      pago: esInv ? "inv" : pago,
      inv: esInv,
    };
    await registrarVenta(t);

    // Descontar stock
    for (const item of comanda) {
      const prod = productos.find((p) => p.id === item.id);
      if (prod) {
        const nuevoStock = Math.max(0, prod.stock - item.qty);
        await actualizar(prod.id, { stock: nuevoStock });
        await registrarMov({
          fecha: FECHA_HOY, hora,
          producto: item.nombre,
          tipo: esInv ? "invitación" : "venta",
          cantidad: -item.qty,
        });
      }
    }

    setTicket(t);
    setShowCobrar(false);
    clearComanda();
  };

  // Reponer stock
  const reponer = async (prodId) => {
    const n = parseInt(repCant);
    if (!n || n <= 0) return;
    const prod = productos.find((p) => p.id === prodId);
    await actualizar(prodId, { stock: (prod?.stock || 0) + n });
    await registrarMov({
      fecha: FECHA_HOY,
      hora: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      producto: prod?.nombre,
      tipo: "reposición",
      cantidad: n,
    });
    setShowRep(null);
    setRepCant("");
  };

  // Drag & drop
  const onDragStart  = (e, id) => { setDragId(id); e.dataTransfer.effectAllowed = "move"; };
  const onDragOver   = (e, id) => { e.preventDefault(); setDragOver(id); };
  const onDrop = async (e, targetId) => {
    e.preventDefault();
    if (dragId === targetId) { setDragId(null); setDragOver(null); return; }
    const arr = [...productos].sort((a, b) => a.orden - b.orden);
    const from = arr.findIndex((p) => p.id === dragId);
    const to   = arr.findIndex((p) => p.id === targetId);
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    await reordenar(arr);
    setDragId(null); setDragOver(null); flash();
  };

  // Categorías
  const addCat = async () => {
    const nueva = `Cat.${categorias.length + 1}`;
    await guardarCats([...categorias, nueva]);
  };
  const renCat = async (idx, nuevo) => {
    const viejo = categorias[idx];
    const nuevaLista = categorias.map((c, i) => i === idx ? nuevo : c);
    await guardarCats(nuevaLista);
    for (const p of productos.filter((x) => x.cat === viejo)) {
      await actualizar(p.id, { cat: nuevo });
    }
    setEditCatIdx(null); flash();
  };
  const delCat = async (idx) => {
    const c = categorias[idx];
    if (productos.some((p) => p.cat === c)) {
      alert("Primero reasigna o elimina los productos de esta categoría");
      return;
    }
    await guardarCats(categorias.filter((_, i) => i !== idx));
    if (catAct === c) setCatAct("Todo");
  };

  // Nuevo producto
  const addProd = async () => {
    await crear({
      nombre: "Nuevo producto",
      cat: categorias[0] || "Sin categoría",
      precio: 1.0, coste: 0.3,
      stock: 0, stockMin: 5,
      activo: true,
      orden: productos.length,
    });
    flash();
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: "#f0f9ff", fontFamily: "system-ui,-apple-system,sans-serif" }}>

      {/* ── TOPBAR ── */}
      <div style={{ background: "#0369a1", color: "white", height: 50, display: "flex",
        alignItems: "center", justifyContent: "space-between", padding: "0 12px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>🏊</span>
          <span style={{ fontWeight: 800, fontSize: 15 }}>Bar Las Varillas</span>
          {alertas.length > 0 && (
            <span style={{ background: "#f59e0b", borderRadius: "50%", width: 18, height: 18,
              fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
              {alertas.length}
            </span>
          )}
          {savedFlash && (
            <span style={{ background: "#10b981", color: "white", borderRadius: 8,
              padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>✓ Guardado</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {["tpv", ...(rol === "admin" ? ["admin"] : [])].map((t) => (
            <button key={t} onClick={() => setPant(t)}
              style={{ padding: "4px 10px", borderRadius: 7, border: "none",
                background: pant === t ? "white" : "rgba(255,255,255,.15)",
                color: pant === t ? "#0369a1" : "white",
                fontWeight: pant === t ? 700 : 500, fontSize: 13, cursor: "pointer" }}>
              {t === "tpv" ? "TPV" : "Admin"}
            </button>
          ))}
          <button onClick={() => setRol(null)}
            style={{ background: "rgba(255,255,255,.15)", border: "none", color: "white",
              borderRadius: 7, width: 30, height: 30, cursor: "pointer", fontSize: 14 }}>🔒</button>
        </div>
      </div>

      {/* Alertas stock */}
      {alertas.length > 0 && (
        <div style={{ background: "#fef3c7", borderBottom: "1px solid #f59e0b", padding: "4px 12px",
          fontSize: 12, color: "#92400e", display: "flex", gap: 6, flexWrap: "wrap",
          alignItems: "center", flexShrink: 0 }}>
          <b>⚠ Stock bajo:</b>
          {alertas.map((a) => (
            <span key={a.id} style={{ background: "#fde68a", borderRadius: 4, padding: "1px 7px" }}>
              {a.nombre} ({a.stock})
            </span>
          ))}
        </div>
      )}

      {/* ════════ TPV ════════ */}
      {pant === "tpv" && (
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Productos */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
            {/* Categorías */}
            <div style={{ padding: "8px 10px 6px", background: "white",
              borderBottom: "1px solid #e2e8f0", overflowX: "auto", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 5, whiteSpace: "nowrap" }}>
                {["Todo", ...categorias].map((c) => (
                  <button key={c} onClick={() => setCatAct(c)}
                    style={{ flexShrink: 0, padding: "5px 13px", borderRadius: 18, border: "none",
                      background: catAct === c ? "#0369a1" : "#e2e8f0",
                      color: catAct === c ? "white" : "#475569",
                      fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid productos */}
            <div style={{ flex: 1, overflowY: "auto", padding: 8,
              display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))",
              gap: 6, alignContent: "start" }}>
              {prodsFilt.map((p) => {
                const en = comanda.find((i) => i.id === p.id);
                return (
                  <button key={p.id} onClick={() => addItem(p)} disabled={p.stock === 0}
                    style={{ background: p.stock === 0 ? "#f8fafc" : "white",
                      border: `2px solid ${en ? "#0369a1" : "#e2e8f0"}`,
                      borderRadius: 11, padding: "9px 6px", cursor: p.stock === 0 ? "not-allowed" : "pointer",
                      textAlign: "center", position: "relative", opacity: p.stock === 0 ? .5 : 1 }}>
                    {en && (
                      <span style={{ position: "absolute", top: -7, right: -7, background: "#0369a1",
                        color: "white", borderRadius: "50%", width: 20, height: 20, fontSize: 11,
                        display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, zIndex: 2 }}>
                        {en.qty}
                      </span>
                    )}
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", marginBottom: 3, lineHeight: 1.2 }}>{p.nombre}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0369a1" }}>{p.precio.toFixed(2)}€</div>
                    <div style={{ fontSize: 10, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: sclr(p), display: "inline-block" }} />
                      <span style={{ color: "#94a3b8" }}>{p.stock}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comanda */}
          <div style={{ width: 250, background: "white", borderLeft: "1px solid #e2e8f0",
            display: "flex", flexDirection: "column", flexShrink: 0 }}>
            <div style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0",
              display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>🧾 Comanda</span>
              {comanda.length > 0 && (
                <button onClick={clearComanda}
                  style={{ background: "#fee2e2", border: "none", color: "#ef4444",
                    borderRadius: 5, padding: "2px 7px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                  Vaciar
                </button>
              )}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "6px 10px" }}>
              {comanda.length === 0 ? (
                <div style={{ textAlign: "center", color: "#94a3b8", marginTop: 30, fontSize: 13 }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>🛒</div>Añade productos
                </div>
              ) : comanda.map((item) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.nombre}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{item.precio.toFixed(2)}€</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <button onClick={() => remItem(item.id)}
                      style={{ width: 22, height: 22, borderRadius: "50%", border: "1px solid #e2e8f0",
                        background: "white", cursor: "pointer", fontSize: 13,
                        display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                    <span style={{ width: 18, textAlign: "center", fontWeight: 700, fontSize: 13 }}>{item.qty}</span>
                    <button onClick={() => addItem(item)}
                      style={{ width: 22, height: 22, borderRadius: "50%", border: "1px solid #e2e8f0",
                        background: "white", cursor: "pointer", fontSize: 13,
                        display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0369a1", minWidth: 42, textAlign: "right" }}>
                    {(item.precio * item.qty).toFixed(2)}€
                  </span>
                </div>
              ))}
            </div>
            {comanda.length > 0 && (
              <div style={{ padding: "10px 12px", borderTop: "1px solid #e2e8f0", flexShrink: 0 }}>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 3 }}>Descuento (%)</div>
                  <input type="number" min="0" max="100" value={desc}
                    onChange={(e) => setDesc(Math.min(100, Math.max(0, Number(e.target.value))))}
                    style={{ width: "100%", padding: "5px 8px", borderRadius: 7,
                      border: "1px solid #e2e8f0", fontSize: 13 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6,
                  paddingTop: 6, borderTop: "2px solid #e2e8f0" }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>TOTAL:</span>
                  <span style={{ fontWeight: 700, fontSize: 16, color: esInv ? "#10b981" : "#0369a1" }}>
                    {esInv ? "INVIT." : totalFinal.toFixed(2) + "€"}
                  </span>
                </div>
                <button onClick={() => setEsInv(!esInv)}
                  style={{ width: "100%", padding: "6px", borderRadius: 7,
                    border: `2px solid ${esInv ? "#10b981" : "#e2e8f0"}`,
                    background: esInv ? "#dcfce7" : "white",
                    color: esInv ? "#166534" : "#64748b",
                    fontWeight: 600, fontSize: 12, cursor: "pointer", marginBottom: 6 }}>
                  {esInv ? "✓ INVITACIÓN" : "🎁 Invitación"}
                </button>
                <button onClick={() => setShowCobrar(true)}
                  style={{ width: "100%", padding: "11px", borderRadius: 9, border: "none",
                    background: "#0369a1", color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                  💳 Cobrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════ ADMIN ════════ */}
      {pant === "admin" && rol === "admin" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ background: "white", borderBottom: "1px solid #e2e8f0",
            display: "flex", overflowX: "auto", flexShrink: 0 }}>
            {[
              { id: "caja",     l: "💰 Caja"        },
              { id: "carta",    l: "✏️ Editar carta" },
              { id: "stock",    l: "📦 Stock"        },
              { id: "ventas",   l: "🧾 Ventas"       },
            ].map((t) => (
              <button key={t.id} onClick={() => setAdminTab(t.id)}
                style={{ padding: "11px 13px", border: "none",
                  borderBottom: `3px solid ${adminTab === t.id ? "#0369a1" : "transparent"}`,
                  background: "none", color: adminTab === t.id ? "#0369a1" : "#64748b",
                  fontWeight: adminTab === t.id ? 700 : 500, fontSize: 13,
                  cursor: "pointer", whiteSpace: "nowrap" }}>
                {t.l}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>

            {/* ── CAJA ── */}
            {adminTab === "caja" && (
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#1e293b", marginBottom: 12 }}>
                  Resumen del día — {FECHA_HOY}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 8, marginBottom: 16 }}>
                  {[
                    { l: "Total vendido",      v: totHoy.toFixed(2)+"€",      c: "#0369a1", bg: "#eff6ff" },
                    { l: "Efectivo",           v: totEfec.toFixed(2)+"€",     c: "#166534", bg: "#dcfce7" },
                    { l: "Tarjeta",            v: totTarj.toFixed(2)+"€",     c: "#1d4ed8", bg: "#dbeafe" },
                    { l: "Coste invitaciones", v: totInv.toFixed(2)+"€",      c: "#92400e", bg: "#fef3c7" },
                    { l: "Nº Tickets",         v: ventasHoy.length,           c: "#7c3aed", bg: "#ede9fe" },
                  ].map((m, i) => (
                    <div key={i} style={{ background: m.bg, borderRadius: 11, padding: "12px 10px" }}>
                      <div style={{ fontSize: 11, color: m.c, opacity: .8, marginBottom: 3 }}>{m.l}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: m.c }}>{m.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#475569", marginBottom: 8 }}>Ventas de hoy</div>
                {ventasHoy.length === 0 ? (
                  <div style={{ color: "#94a3b8", textAlign: "center", padding: 20 }}>Sin ventas hoy</div>
                ) : ventasHoy.map((v) => (
                  <div key={v.id} style={{ background: "white", borderRadius: 9, padding: "9px 11px",
                    border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 5 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>
                        {v.hora} · {v.items?.map((i) => `${i.qty}× ${i.nombre}`).join(", ")}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {v.inv ? "🎁 Invitación" : v.pago === "efectivo" ? "💵 Efectivo" : "💳 Tarjeta"}
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: v.inv ? "#10b981" : "#0369a1" }}>
                      {v.inv ? "Inv." : v.total?.toFixed(2) + "€"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* ── EDITAR CARTA ── */}
            {adminTab === "carta" && (
              <div>
                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10,
                  padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#1e40af" }}>
                  💡 <b>Clic</b> en cualquier nombre o precio para editarlo. <b>Arrastra</b> las tarjetas para cambiar el orden. Cambios guardados en la nube al instante.
                </div>

                {/* Categorías */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>Categorías</span>
                    <button onClick={addCat}
                      style={{ background: "#eff6ff", color: "#0369a1", border: "1px solid #bfdbfe",
                        borderRadius: 7, padding: "3px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                      + Nueva
                    </button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {categorias.map((c, i) => (
                      <div key={c} style={{ display: "flex", alignItems: "center", gap: 4,
                        background: "white", border: "1px solid #e2e8f0", borderRadius: 20, padding: "4px 10px" }}>
                        {editCatIdx === i ? (
                          <input autoFocus defaultValue={c}
                            onBlur={(e) => renCat(i, e.target.value || c)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") renCat(i, e.target.value || c);
                              if (e.key === "Escape") setEditCatIdx(null);
                            }}
                            style={{ border: "none", borderBottom: "2px solid #0369a1",
                              background: "transparent", fontSize: 13, fontWeight: 600,
                              width: 100, outline: "none" }} />
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#475569", cursor: "text" }}
                            onClick={() => setEditCatIdx(i)}>{c}</span>
                        )}
                        <button onClick={() => setEditCatIdx(i)}
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#94a3b8", padding: 0 }}>✏️</button>
                        <button onClick={() => delCat(i)}
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#fca5a5", padding: 0 }}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Filtro + añadir */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", gap: 5, overflowX: "auto" }}>
                    {["Todas", ...categorias].map((c) => (
                      <button key={c}
                        onClick={() => setCatEditorFiltro(c === "Todas" ? "Todo" : c)}
                        style={{ flexShrink: 0, padding: "5px 12px", borderRadius: 18, border: "none",
                          background: (c === "Todas" && catEditorFiltro === "Todo") || c === catEditorFiltro ? "#0369a1" : "#e2e8f0",
                          color: (c === "Todas" && catEditorFiltro === "Todo") || c === catEditorFiltro ? "white" : "#475569",
                          fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                        {c}
                      </button>
                    ))}
                  </div>
                  <button onClick={addProd}
                    style={{ background: "#0369a1", color: "white", border: "none",
                      borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                    + Añadir producto
                  </button>
                </div>

                {/* Tarjetas editables */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 8 }}>
                  {(catEditorFiltro === "Todo" ? productos : productos.filter((p) => p.cat === catEditorFiltro))
                    .sort((a, b) => a.orden - b.orden)
                    .map((p) => (
                      <div key={p.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, p.id)}
                        onDragOver={(e) => onDragOver(e, p.id)}
                        onDrop={(e) => onDrop(e, p.id)}
                        onDragEnd={() => { setDragId(null); setDragOver(null); }}
                        style={{ background: "white",
                          border: `2px solid ${dragOver === p.id ? "#0369a1" : p.activo ? "#e2e8f0" : "#fecaca"}`,
                          borderRadius: 12, padding: "12px 14px", cursor: "grab",
                          userSelect: "none", opacity: dragId === p.id ? .3 : 1,
                          transition: "border-color .15s, opacity .15s" }}>

                        {/* Cabecera */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                          <span style={{ fontSize: 16, color: "#cbd5e1", cursor: "grab" }}>⠿</span>
                          <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                            <IE value={p.nombre} onChange={(v) => { actualizar(p.id, { nombre: v }); flash(); }}
                              style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }} />
                          </span>
                          <button onClick={() => { actualizar(p.id, { activo: !p.activo }); flash(); }}
                            style={{ width: 26, height: 26, borderRadius: "50%", border: "none",
                              background: p.activo ? "#dcfce7" : "#fee2e2", cursor: "pointer",
                              fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {p.activo ? "✓" : "✗"}
                          </button>
                          <button onClick={() => { if (window.confirm(`¿Eliminar "${p.nombre}"?`)) eliminar(p.id); }}
                            style={{ width: 26, height: 26, borderRadius: "50%", border: "none",
                              background: "#fee2e2", color: "#ef4444", cursor: "pointer",
                              fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            🗑
                          </button>
                        </div>

                        {/* Categoría */}
                        <div style={{ marginBottom: 8 }}>
                          <select value={p.cat}
                            onChange={(e) => { actualizar(p.id, { cat: e.target.value }); flash(); }}
                            style={{ fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 7,
                              padding: "3px 7px", background: "#f8fafc", color: "#64748b", cursor: "pointer" }}>
                            {categorias.map((c) => <option key={c}>{c}</option>)}
                          </select>
                        </div>

                        {/* Precios */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                          {[
                            { l: "PVP",      k: "precio", c: "#0369a1", bg: "#eff6ff" },
                            { l: "Coste",    k: "coste",  c: "#475569", bg: "#f8fafc" },
                            { l: "Stock mín",k: "stockMin",c:"#64748b", bg: "#f8fafc" },
                          ].map((f) => (
                            <div key={f.k} style={{ background: f.bg, borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
                              <div style={{ fontSize: 10, color: f.c, opacity: .7, marginBottom: 2 }}>{f.l}</div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: f.c }}>
                                <IE value={p[f.k]} type="number"
                                  onChange={(v) => { actualizar(p.id, { [f.k]: parseFloat(v) || 0 }); flash(); }}
                                  suffix={f.k !== "stockMin" ? "€" : ""}
                                  style={{ fontSize: 14, fontWeight: 700, color: f.c, width: 55, textAlign: "center" }} />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Stock actual */}
                        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: sclr(p), display: "inline-block", flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: "#64748b" }}>Stock:</span>
                          <span style={{ fontWeight: 700, fontSize: 13, color: sclr(p) }}>
                            <IE value={p.stock} type="number"
                              onChange={(v) => { actualizar(p.id, { stock: parseInt(v) || 0 }); flash(); }}
                              style={{ fontSize: 13, fontWeight: 700, color: sclr(p), width: 50 }} />
                          </span>
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>uds</span>
                        </div>

                        {!p.activo && (
                          <div style={{ marginTop: 7, background: "#fee2e2", color: "#991b1b",
                            borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600, textAlign: "center" }}>
                            DESACTIVADO — no aparece en TPV
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* ── STOCK ── */}
            {adminTab === "stock" && (
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#1e293b", marginBottom: 12 }}>Stock actual</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 8, marginBottom: 16 }}>
                  {productos.filter((p) => p.activo).sort((a, b) => a.orden - b.orden).map((p) => {
                    const c = sclr(p);
                    const bg = c === "#10b981" ? "#dcfce7" : c === "#f59e0b" ? "#fef3c7" : "#fee2e2";
                    const tc = c === "#10b981" ? "#166534" : c === "#f59e0b" ? "#92400e" : "#991b1b";
                    return (
                      <div key={p.id} style={{ background: "white", borderRadius: 11,
                        border: "1px solid #e2e8f0", padding: "11px 12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 7 }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{p.nombre}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.cat}</div>
                          </div>
                          <span style={{ background: bg, color: tc, borderRadius: 5,
                            padding: "2px 7px", fontSize: 11, fontWeight: 700 }}>{p.stock}</span>
                        </div>
                        <div style={{ height: 5, background: "#e2e8f0", borderRadius: 3, marginBottom: 8, overflow: "hidden" }}>
                          <div style={{ height: "100%", background: c, borderRadius: 3,
                            width: `${Math.min(100, (p.stock / Math.max(p.stock, p.stockMin * 4)) * 100)}%` }} />
                        </div>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 7 }}>
                          Mínimo: {p.stockMin} · Coste: {p.coste?.toFixed(2)}€
                        </div>
                        <button onClick={() => setShowRep(p.id)}
                          style={{ width: "100%", padding: "5px", borderRadius: 7, border: "1px solid #e2e8f0",
                            background: "#f8fafc", color: "#475569", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                          + Reponer
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#475569", marginBottom: 8 }}>Movimientos recientes</div>
                {movimientos.length === 0 ? (
                  <div style={{ color: "#94a3b8", textAlign: "center", padding: 16 }}>Sin movimientos</div>
                ) : movimientos.slice(0, 30).map((m) => (
                  <div key={m.id} style={{ background: "white", borderRadius: 7, border: "1px solid #e2e8f0",
                    padding: "7px 10px", display: "flex", justifyContent: "space-between",
                    fontSize: 12, marginBottom: 4 }}>
                    <span><b>{m.producto}</b> <span style={{ color: "#94a3b8" }}>{m.hora}</span></span>
                    <span style={{ fontWeight: 700,
                      color: m.cantidad > 0 ? "#10b981" : m.tipo === "invitación" ? "#f59e0b" : "#ef4444" }}>
                      {m.cantidad > 0 ? "+" : ""}{m.cantidad} ({m.tipo})
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* ── VENTAS ── */}
            {adminTab === "ventas" && (
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#1e293b", marginBottom: 12 }}>Historial completo</div>
                {ventas.length === 0 ? (
                  <div style={{ color: "#94a3b8", textAlign: "center", padding: 24 }}>Sin ventas</div>
                ) : ventas.map((v) => (
                  <div key={v.id} style={{ background: "white", borderRadius: 10, padding: "10px 12px",
                    border: "1px solid #e2e8f0", marginBottom: 5 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{v.fecha} · {v.hora}</span>
                      <span style={{ fontWeight: 700, fontSize: 14, color: v.inv ? "#10b981" : "#0369a1" }}>
                        {v.inv ? "INVITACIÓN" : v.total?.toFixed(2) + "€"}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {v.items?.map((i) => `${i.qty}× ${i.nombre}`).join(" · ")}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
                      {v.inv ? "🎁 Invitación" : v.pago === "efectivo" ? "💵 Efectivo" : "💳 Tarjeta"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── COBRAR MODAL ── */}
      {showCobrar && (
        <Modal onClose={() => setShowCobrar(false)} title="Forma de pago">
          {!esInv ? (
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, textAlign: "center", color: "#0369a1", marginBottom: 18 }}>
                {totalFinal.toFixed(2)}€
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                {["efectivo", "tarjeta"].map((p) => (
                  <button key={p} onClick={() => setPago(p)}
                    style={{ padding: "14px 8px", borderRadius: 11,
                      border: `2px solid ${pago === p ? "#0369a1" : "#e2e8f0"}`,
                      background: pago === p ? "#eff6ff" : "white",
                      fontWeight: 600, fontSize: 14, cursor: "pointer",
                      color: pago === p ? "#0369a1" : "#475569" }}>
                    {p === "efectivo" ? "💵 Efectivo" : "💳 Tarjeta"}
                  </button>
                ))}
              </div>
              <button onClick={cobrar} disabled={!pago}
                style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none",
                  background: pago ? "#0369a1" : "#e2e8f0",
                  color: pago ? "white" : "#94a3b8",
                  fontWeight: 700, fontSize: 15, cursor: pago ? "pointer" : "default" }}>
                ✓ Confirmar cobro
              </button>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "10px 0 6px" }}>
              <div style={{ fontSize: 38, marginBottom: 8 }}>🎁</div>
              <div style={{ fontSize: 16, color: "#166534", fontWeight: 600, marginBottom: 4 }}>Invitación de la casa</div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 18 }}>Descuenta del stock, no de la caja</div>
              <button onClick={cobrar}
                style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none",
                  background: "#10b981", color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                ✓ Confirmar
              </button>
            </div>
          )}
        </Modal>
      )}

      {/* ── TICKET ── */}
      {ticket && (
        <Modal onClose={() => setTicket(null)} title="Ticket emitido">
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>Bar Las Varillas · {ticket.fecha} {ticket.hora}</div>
            {ticket.inv && (
              <div style={{ background: "#dcfce7", color: "#166534", borderRadius: 6,
                padding: "3px 10px", display: "inline-block", marginTop: 5, fontSize: 12, fontWeight: 600 }}>
                🎁 INVITACIÓN
              </div>
            )}
          </div>
          <div style={{ borderTop: "1px dashed #e2e8f0", borderBottom: "1px dashed #e2e8f0", padding: "8px 0", margin: "8px 0" }}>
            {ticket.items?.map((it, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 13 }}>
                <span>{it.qty}× {it.nombre}</span>
                <span>{(it.precio * it.qty).toFixed(2)}€</span>
              </div>
            ))}
          </div>
          {ticket.desc > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#ef4444", marginBottom: 3 }}>
              <span>Descuento {ticket.desc}%</span>
              <span>-{(ticket.sub * ticket.desc / 100).toFixed(2)}€</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 17,
            paddingTop: 7, borderTop: "2px solid #e2e8f0" }}>
            <span>TOTAL</span>
            <span style={{ color: ticket.inv ? "#10b981" : "#0369a1" }}>
              {ticket.inv ? "0.00€ (inv.)" : ticket.total?.toFixed(2) + "€"}
            </span>
          </div>
          {!ticket.inv && (
            <div style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: "#64748b" }}>
              Pago: {ticket.pago === "efectivo" ? "💵 Efectivo" : "💳 Tarjeta"}
            </div>
          )}
          <button onClick={() => setTicket(null)}
            style={{ width: "100%", marginTop: 14, padding: "10px", borderRadius: 8, border: "none",
              background: "#0369a1", color: "white", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Cerrar
          </button>
        </Modal>
      )}

      {/* ── REPONER ── */}
      {showRep && (
        <Modal onClose={() => { setShowRep(null); setRepCant(""); }}
          title={`Reponer: ${productos.find((p) => p.id === showRep)?.nombre}`}>
          <div style={{ marginBottom: 6, fontSize: 13, color: "#64748b" }}>
            Stock actual: <b>{productos.find((p) => p.id === showRep)?.stock} uds</b>
          </div>
          <input type="number" min="1" placeholder="Cantidad a añadir" value={repCant}
            onChange={(e) => setRepCant(e.target.value)}
            style={{ width: "100%", padding: "9px 11px", borderRadius: 8,
              border: "1px solid #e2e8f0", fontSize: 15, marginBottom: 12 }} />
          <button onClick={() => reponer(showRep)}
            style={{ width: "100%", padding: "12px", borderRadius: 9, border: "none",
              background: "#0369a1", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            ✓ Reponer stock
          </button>
        </Modal>
      )}
    </div>
  );
}
