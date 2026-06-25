// ============================================================
//  PASO 1: RELLENA AQUÍ TUS DATOS DE FIREBASE
//  (los encuentras en Firebase Console → tu proyecto → ⚙️ → Configuración)
// ============================================================

import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            "PEGA_AQUI_TU_apiKey",
  authDomain:        "PEGA_AQUI_TU_authDomain",
  projectId:         "PEGA_AQUI_TU_projectId",
  storageBucket:     "PEGA_AQUI_TU_storageBucket",
  messagingSenderId: "PEGA_AQUI_TU_messagingSenderId",
  appId:             "PEGA_AQUI_TU_appId"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Modo offline: la app sigue funcionando sin internet
enableIndexedDbPersistence(db).catch(() => {});
