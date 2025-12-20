Criar usuário admin (Firebase Admin SDK)
========================================

Este guia mostra como criar um usuário com permissões de administrador (custom claim `admin: true`) usando o Firebase Admin SDK (Node.js).

Pré-requisitos
--------------
- Conta no Firebase e projeto criado.
- Acesso ao Console Firebase (Project Settings) para gerar o Service Account JSON.
- Ter o provedor Email/Password habilitado no Console → Authentication → Sign-in method.
- Node.js instalado.

Passos
------
1. Habilite o provedor Email/Password:
   - Firebase Console → Authentication → Sign-in method → ative "Email/Password".

2. Habilite a API Identity Toolkit (se necessário):
   - Google Cloud Console → APIs & Services → Library → procure por "Identity Toolkit API" → Enable.

3. Baixe as credenciais de Service Account:
   - Firebase Console → Project Settings → Service accounts → Generate new private key
   - Salve o arquivo como `serviceAccountKey.json` na pasta do projeto (não comite este arquivo no repositório).

4. Instale dependência e execute o script:

   - No terminal, na pasta do projeto:
     ```bash
     npm init -y
     npm i firebase-admin
     ```

   - Criar admin (modo simples):
     ```bash
     node create_admin.js admin@exemplo.com SenhaForte123!
     ```

   - Ou execute em modo interativo (sem passar argumentos):
     ```bash
     node create_admin.js
     ```

Observações
-----------
- Não armazene `serviceAccountKey.json` em repositórios públicos.
- Após adicionar a claim `admin:true`, pode levar alguns segundos para que o token do usuário no cliente reflita a mudança; o usuário pode precisar fazer logout/login novamente.

Como verificar na aplicação cliente
----------------------------------
No cliente (browser), após login, verifique se o usuário possui a claim admin:

```javascript
firebase.auth().onAuthStateChanged(user => {
  if (!user) return;
  user.getIdTokenResult().then(idTokenResult => {
    if (idTokenResult.claims.admin) {
      // Usuário é admin -> habilitar gravação
    }
  });
});
```

Regras do Firestore (exemplo)
-----------------------------
Ajuste as regras do Firestore para permitir escritura apenas para admins:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /estoque/{doc} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

Se quiser, eu posso:
- adicionar um script adicional para remover a claim `admin` ou listar usuários;
- automaticamente aplicar claims a usuários existentes por e-mail.

