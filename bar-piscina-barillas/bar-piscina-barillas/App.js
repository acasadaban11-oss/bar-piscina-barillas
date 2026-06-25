import { useState, useEffect } from "react";
import {
  collection, doc, onSnapshot, setDoc, updateDoc,
  addDoc, deleteDoc, serverTimestamp, writeBatch, getDocs
} from "firebase/firestore";
import { db } from "./firebase";

const PRODS_INICIALES = [
  { nombre:"Cerveza",       cat:"Cervezas",  precio:2.5,  coste:0.8, stock:100, stockMin:15, activo:true, orden:0  },
  { nombre:"Cerveza Sin",   cat:"Cervezas",  precio:2.5,  coste:0.8, stock:50,  stockMin:10, activo:true, orden:1  },
  { nombre:"Tinto Verano",  cat:"Cervezas",  precio:3.0,  coste:0.9, stock:40,  stockMin:8,  activo:true, orden:2  },
  { nombre:"Coca-Cola",     cat:"Refrescos", precio:2.0,  coste:0.6, stock:80,  stockMin:15, activo:true, orden:3  },
  { nombre:"Fanta Naranja", cat:"Refrescos", precio:2.0,  coste:0.6, stock:60,  stockMin:10, activo:true, orden:4  },
  { nombre:"Agua 50cl",     cat:"Refrescos", precio:1.5,  coste:0.3, stock:120, stockMin:20, activo:true, orden:5  },
  { nombre:"Mojito",        cat:"Cócteles",  precio:6.0,  coste:1.5, stock:30,  stockMin:5,  activo:true, orden:6  },
  { nombre:"Sangría",       cat:"Cócteles",  precio:4.5,  coste:1.2, stock:20,  stockMin:5,  activo:true, orden:7  },
  { nombre:"Patatas Fritas",cat:"Snacks",    precio:2.5,  coste:0.7, stock:40,  stockMin:8,  activo:true, orden:8  },
  { nombre:"Nachos",        cat:"Snacks",    precio:3.5,  coste:1.0, stock:30,  stockMin:5,  activo:true, orden:9  },
  { nombre:"Helado Polo",   cat:"Extras",    precio:2.0,  coste:0.6, stock:50,  stockMin:10, activo:true, orden:10 },
  { nombre:"Café",          cat:"Extras",    precio:1.5,  coste:0.4, stock:60,  stockMin:10, activo:true, orden:11 },
];

// ─── PRODUCTOS ───────────────────────────────────────────────
export function useProductos() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "productos"), async (snap) => {
      if (snap.empty) {
        // Primera vez: carga los productos iniciales
        const batch = writeBatch(db);
        PRODS_INICIALES.forEach((p) => {
          batch.set(doc(collection(db, "productos")), p);
        });
        await batch.commit();
        return;
      }
      setProductos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setCargando(false);
    });
    return unsub;
  }, []);

  const actualizar = async (id, campos) => {
    await updateDoc(doc(db, "productos", id), campos);
  };

  const crear = async (datos) => {
    await addDoc(collection(db, "productos"), datos);
  };

  const eliminar = async (id) => {
    await deleteDoc(doc(db, "productos", id));
  };

  const reordenar = async (productosOrdenados) => {
    const batch = writeBatch(db);
    productosOrdenados.forEach((p, i) => {
      batch.update(doc(db, "productos", p.id), { orden: i });
    });
    await batch.commit();
  };

  return { productos, cargando, actualizar, crear, eliminar, reordenar };
}

// ─── VENTAS ──────────────────────────────────────────────────
export function useVentas() {
  const [ventas, setVentas] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "ventas"), (snap) => {
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      lista.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setVentas(lista);
    });
    return unsub;
  }, []);

  const registrar = async (venta) => {
    await addDoc(collection(db, "ventas"), {
      ...venta,
      timestamp: serverTimestamp(),
    });
  };

  return { ventas, registrar };
}

// ─── MOVIMIENTOS DE STOCK ─────────────────────────────────────
export function useMovimientos() {
  const [movimientos, setMovimientos] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "movimientos"), (snap) => {
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      lista.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setMovimientos(lista);
    });
    return unsub;
  }, []);

  const registrar = async (mov) => {
    await addDoc(collection(db, "movimientos"), {
      ...mov,
      timestamp: serverTimestamp(),
    });
  };

  return { movimientos, registrar };
}

// ─── CATEGORÍAS ───────────────────────────────────────────────
export function useCategorias() {
  const [categorias, setCategorias] = useState(["Cervezas","Refrescos","Cócteles","Snacks","Extras"]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "config", "categorias"), (snap) => {
      if (snap.exists()) {
        setCategorias(snap.data().lista || []);
      }
    });
    return unsub;
  }, []);

  const guardar = async (lista) => {
    await setDoc(doc(db, "config", "categorias"), { lista });
  };

  return { categorias, guardar };
}
