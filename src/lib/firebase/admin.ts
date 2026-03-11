import admin from 'firebase-admin';

export function initializeAdminApp() {
  if (admin.apps.length) return admin;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    // Se faltarem chaves durante o build, retorna o admin sem inicializar
    // para não quebrar o prerendering estático se as chaves forem injetadas
    // apenas em runtime na Vercel.
    return admin;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: projectId,
      clientEmail: clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    })
  });

  return admin;
}