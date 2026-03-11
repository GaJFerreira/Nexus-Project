import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Proteção para o build do Next.js (prerendering)
// Inicializa apenas se tivermos a API Key ou se estivermos no navegador
if (firebaseConfig.apiKey) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
} else {
    // Mock simples para evitar erros de importação durante o build no servidor
    // O build do Next.js tenta renderizar as páginas estaticamente, e se o Firebase
    // inicializar sem chaves, ele quebra o build.
    app = {} as FirebaseApp;
    auth = {} as Auth;
    db = {} as Firestore;
}

export { app, auth, db };