#!/usr/bin/env node
// create_admin.js
// Cria um usuário Email/Password e aplica custom claim { admin: true } usando Firebase Admin SDK

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('\nErro: arquivo `serviceAccountKey.json` não encontrado no diretório do projeto.');
  console.error('Baixe o JSON do Service Account no Console Firebase (Project Settings → Service accounts) e salve como `serviceAccountKey.json` no mesmo diretório deste script.\n');
  process.exit(1);
}

const admin = require('firebase-admin');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function createAdmin(email, password) {
  if (!email || !password) {
    console.error('Uso: node create_admin.js <email> <senha>');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('Senha fraca: use pelo menos 6 caracteres.');
    process.exit(1);
  }

  try {
    const user = await admin.auth().createUser({ email: email, password: password });
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log('\n✅ Usuário criado com sucesso:');
    console.log('   uid:  ', user.uid);
    console.log('   email:', user.email);
    console.log('\nA claim `admin:true` foi adicionada.');
    console.log('OBS: Pode levar alguns segundos até que o token do usuário reflita as novas claims no cliente.');
  } catch (err) {
    console.error('\nErro ao criar usuário / aplicar claim:');
    console.error(err && err.message ? err.message : err);
    process.exit(1);
  }
}

function promptInteractive() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Email: ', (email) => {
    rl.question('Senha (min 6 caracteres): ', (password) => {
      rl.close();
      createAdmin(email.trim(), password.trim());
    });
  });
}

// Leitura de argumentos: node create_admin.js email password
const args = process.argv.slice(2);
if (args.length >= 2) {
  createAdmin(args[0], args[1]);
} else {
  console.log('Modo interativo:');
  promptInteractive();
}
