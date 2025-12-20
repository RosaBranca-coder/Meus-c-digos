// ===============================
// FIREBASE / FIRESTORE
// ===============================
let db = null;          // referência global ao Firestore
let estoqueAtual = [];  // lista em memória (espelhando o Firestore)

// 🔧 COLE AQUI SUA CONFIG DO FIREBASE
// Pegue em: Configurações do projeto → Seus apps → Web → Configuração
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAXtTNe8Z7bIi5XE0FaO34M5Bb9-gTYLfU",
  authDomain: "database-3bitaim004.firebaseapp.com",
  projectId: "database-3bitaim004",
  storageBucket: "database-3bitaim004.appspot.com", // <- CORRETO AQUI
  messagingSenderId: "776862658000",
  appId: "1:776862658000:web:eb3abb3095e5cda8569dd5",
  measurementId: "G-8DRRP3DRJJ"
};

try {
    if (typeof firebase !== "undefined") {
        // Evita inicializar duas vezes caso script.js seja carregado em mais de uma página
        if (firebase.apps && firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        console.log("🔥 Firebase/Firestore inicializado.");
        if (firebase.auth) { try { setTimeout(initAuth, 0); } catch(e) { console.warn('initAuth falhou:', e); } }
    } else {
        console.warn("Firebase não está disponível nesta página (provavelmente index.html).");
    }
} catch (e) {
    console.error("Erro ao inicializar Firebase:", e);
}

// ===============================
// ARMAZENAMENTO (agora baseado em memória / Firestore)
// ===============================

// Função de conveniência para pegar a lista atual
function carregarEstoque() {
    return estoqueAtual || [];
}

// (mantida para compat, mas não usada com Firestore)
function salvarEstoque(lista) {
    console.warn("salvarEstoque chamado, mas Firestore é a fonte de verdade agora.");
}

// ===============================
// UTILITÁRIOS
// ===============================
function formatarData(dataStr) {
    if (!dataStr) return "";
    var d = new Date(dataStr);
    if (isNaN(d.getTime())) return dataStr;
    return d.toLocaleDateString("pt-BR");
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function formatarEtiqueta(item) {
    var linhas = [];
    linhas.push("Cat: " + (item.categoria || ""));
    linhas.push("Nome: " + (item.nome || ""));
    linhas.push("Qtd: " + (item.quantidade || ""));
    linhas.push("Peso: " + (item.peso || ""));
    linhas.push("Data: " + formatarData(item.data));
    linhas.push("Val: " + formatarData(item.validade));
    linhas.push("Resp: " + (item.responsavel || ""));
    return linhas.join("\n");
}

// ===============================
// AUTENTICAÇÃO (Firebase)
// ===============================
let auth = null;

function initAuth() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
        console.warn('Firebase Auth não disponível.');
        return;
    }
    auth = firebase.auth();
    auth.onAuthStateChanged(function(user) {
        updateAuthUI();
    });
}

function isAuthorized() {
    if (auth && auth.currentUser) return true;
    // fallback para páginas sem Firebase (compatibilidade)
    return sessionStorage.getItem("autorizado") === "true";
}

function abrirModalAuth() {
    var modal = document.getElementById("auth-modal");
    if (!modal) return;
    var user = auth && auth.currentUser;
    if (user) {
        // mostra painel de usuário logado
        document.getElementById("auth-form").style.display = 'none';
        document.getElementById("auth-logged").style.display = 'block';
        document.getElementById("auth-email").textContent = user.email || '(sem email)';
    } else {
        // mostra formulário de login
        document.getElementById("auth-form").style.display = 'block';
        document.getElementById("auth-logged").style.display = 'none';
        var fb = document.getElementById("auth-feedback"); if (fb) fb.style.display = 'none';
        document.getElementById("auth-email-input").value = '';
        document.getElementById("auth-password-input").value = '';
        document.getElementById("auth-email-input").focus();
    }
    modal.style.display = 'flex';
}

function fecharModalAuth() {
    var modal = document.getElementById("auth-modal");
    if (!modal) return;
    modal.style.display = "none";
}

function showAuthFeedback(msg) {
    var fb = document.getElementById('auth-feedback');
    if (fb) { fb.style.display = 'block'; fb.textContent = msg; }
}

function signIn() {
    var email = (document.getElementById('auth-email-input')||{}).value || '';
    var password = (document.getElementById('auth-password-input')||{}).value || '';
    if (!email || !password) { showAuthFeedback('Preencha email e senha.'); return; }
    if (!auth) { showAuthFeedback('Firebase Auth não disponível.'); return; }
    auth.signInWithEmailAndPassword(email, password).then(function() {
        fecharModalAuth();
        alert('Login efetuado.');
    }).catch(function(e){
        console.error('signIn erro:', e);
        var msg = e && e.message ? e.message : 'Erro ao autenticar.';
        if (e && e.code === 'auth/operation-not-allowed') {
            msg = 'Email/Password não habilitado no Firebase. Ative em Console Firebase → Authentication → Sign-in method.';
        } else if (e && e.code === 'auth/configuration-not-found') {
            msg = 'Configuração do provedor não encontrada: verifique no Console Firebase → Authentication → Sign-in method se Email/Password está ativado.';
        }
        showAuthFeedback(msg);
    });
}

function createAccount() {
    var email = (document.getElementById('auth-email-input')||{}).value || '';
    var password = (document.getElementById('auth-password-input')||{}).value || '';
    if (!email || !password) { showAuthFeedback('Preencha email e senha.'); return; }
    if (!auth) { showAuthFeedback('Firebase Auth não disponível.'); return; }
    auth.createUserWithEmailAndPassword(email, password).then(function() {
        fecharModalAuth();
        alert('Conta criada e logada.');
    }).catch(function(e){
        console.error('createAccount erro:', e);
        var msg = e && e.message ? e.message : 'Erro ao criar conta.';
        if (e && e.code === 'auth/operation-not-allowed') {
            msg = 'Criação de conta Email/Password não permitida: habilite Email/Password em Console Firebase → Authentication → Sign-in method.';
        } else if (e && e.code === 'auth/weak-password') {
            msg = 'Senha fraca: use pelo menos 6 caracteres.';
        } else if (e && e.code === 'auth/email-already-in-use') {
            msg = 'Este email já está em uso.';
        } else if (e && e.code === 'auth/configuration-not-found') {
            msg = 'Configuração do provedor não encontrada: ative Email/Password em Console Firebase → Authentication → Sign-in method.';
        }
        showAuthFeedback(msg);
    });
}

function signOut() {
    if (!auth) return;
    auth.signOut().then(function() { fecharModalAuth(); alert('Desconectado.'); });
}

function changePasswordPrompt() {
    if (!auth || !auth.currentUser) { alert('Nenhum usuário autenticado.'); return; }
    var current = prompt('Digite a sua senha atual para confirmar:');
    if (current === null) return;
    var newPass = prompt('Nova senha:');
    if (newPass === null) return;
    if (newPass.length < 6) { alert('Senha deve ter pelo menos 6 caracteres.'); return; }
    var email = auth.currentUser.email;
    var credential = firebase.auth.EmailAuthProvider.credential(email, current);
    auth.currentUser.reauthenticateWithCredential(credential).then(function() {
        auth.currentUser.updatePassword(newPass).then(function(){ alert('Senha atualizada.'); }).catch(function(e){ alert('Erro ao atualizar senha: ' + (e && e.message ? e.message : e)); });
    }).catch(function(e){ alert('Reautenticação falhou: ' + (e && e.message ? e.message : e)); });
}

function updateAuthUI() {
    var user = auth && auth.currentUser;
    var btnAuth = document.getElementById("btn-auth");
    if (btnAuth) btnAuth.textContent = user ? "Bloquear" : "Desbloquear";
    var addBtn = document.getElementById("btn-add");
    if (addBtn) addBtn.disabled = !user;
    // desabilita inputs do formulário
    var ids = ["item","quantidade","peso","data","validade","responsavel","categoria"];
    for (var i = 0; i < ids.length; i++) {
        var el = document.getElementById(ids[i]);
        if (el) el.disabled = !user;
    }
    // re-renderizar lista para aplicar botões desabilitados
    try { renderizarLista(); } catch(e) { /* render pode não existir nesta página */ }
}

// ===============================
// RENDERIZAÇÃO DA TABELA
// ===============================
function renderizarLista() {
    var lista = carregarEstoque();
    var tbody = document.getElementById("lista-estoque");
    if (!tbody) return;

    var html = "";

    for (var i = 0; i < lista.length; i++) {
        var it = lista[i];
        html += "<tr>";
        html += "<td>" + escapeHtml(it.categoria || "") + "</td>";
        html += "<td>" + escapeHtml(it.nome || "") + "</td>";
        html += "<td>" + escapeHtml(String(it.quantidade || "")) + "</td>";
        html += "<td>" + escapeHtml(it.peso || "") + "</td>";
        html += "<td>" + escapeHtml(formatarData(it.data)) + "</td>";
        html += "<td>" + escapeHtml(formatarData(it.validade)) + "</td>";
        html += "<td>" + escapeHtml(it.responsavel || "") + "</td>";
        html += "<td>";
        var editDisabled = isAuthorized() ? "" : " disabled ";
        var remDisabled = isAuthorized() ? "" : " disabled ";
        html += "<button onclick='editarItem(" + i + ")' " + editDisabled + ">Editar</button> ";
        html += "<button onclick='removerItem(" + i + ")' " + remDisabled + ">Remover</button> ";
        html += "<button onclick='gerarEtiqueta(" + i + ")'>Etiqueta</button>";
        html += "</td>";
        html += "</tr>";
    }

    tbody.innerHTML = html;
}

// ===============================
// CRUD DO ESTOQUE (via Firestore)
// ===============================
function adicionarItem() {
    if (!db) {
        alert("Banco de dados não inicializado (Firebase). Verifique a configuração.");
        return;
    }
    if (!isAuthorized()) { alert("Acesso negado: somente pessoal autorizado pode adicionar itens."); return; }

    var nome = document.getElementById("item").value.trim();
    var quantidade = parseFloat(document.getElementById("quantidade").value);
    var peso = document.getElementById("peso").value;
    var data = document.getElementById("data").value;
    var validade = document.getElementById("validade").value;
    var responsavel = document.getElementById("responsavel").value;
    var categoria = document.getElementById("categoria").value;

    if (!nome || isNaN(quantidade) || quantidade <= 0) {
        alert("Preencha o nome e uma quantidade válida.");
        return;
    }

    db.collection("estoque").add({
        nome: nome,
        quantidade: quantidade,
        peso: peso,
        data: data,
        validade: validade,
        responsavel: responsavel,
        categoria: categoria
    }).then(() => {
        limparFormulario();
        // Não precisa renderizar: o onSnapshot vai disparar
    }).catch((e) => {
        console.error("Erro ao adicionar item:", e);
        alert("Erro ao adicionar item. Veja o console.");
    });
}

function limparFormulario() {
    var ids = ["item", "quantidade", "peso", "data", "validade", "responsavel", "categoria"];
    for (var i = 0; i < ids.length; i++) {
        var el = document.getElementById(ids[i]);
        if (el) el.value = "";
    }
    var primeiro = document.getElementById("item");
    if (primeiro) primeiro.focus();
}

function removerItem(index) {
    if (!db) return;
    if (!isAuthorized()) { alert("Acesso negado: somente pessoal autorizado pode remover itens."); return; }

    var lista = carregarEstoque();
    if (index < 0 || index >= lista.length) return; 

    var item = lista[index];
    if (!item || !item.id) {
        console.error("Item sem ID Firestore:", item);
        return;
    }

    db.collection("estoque").doc(item.id).delete()
        .catch((e) => {
            console.error("Erro ao remover item:", e);
            alert("Erro ao remover item. Veja o console.");
        });
}

function editarItem(index) {
    if (!db) return;
    if (!isAuthorized()) { alert("Acesso negado: somente pessoal autorizado pode editar itens."); return; }

    var lista = carregarEstoque();
    var it = lista[index];
    if (!it) return; 

    // Preenche o formulário
    document.getElementById("item").value = it.nome || "";
    document.getElementById("quantidade").value = it.quantidade || "";
    document.getElementById("peso").value = it.peso || "";
    document.getElementById("data").value = it.data || "";
    document.getElementById("validade").value = it.validade || "";
    document.getElementById("responsavel").value = it.responsavel || "";
    document.getElementById("categoria").value = it.categoria || "";

    // Remove o registro atual; ao salvar de novo, cria outro (mesmo comportamento do antigo)
    if (it.id) {
        db.collection("estoque").doc(it.id).delete()
            .catch((e) => {
                console.error("Erro ao remover item para edição:", e);
            });
    }
}

// ===============================
// GERAÇÃO DE ETIQUETA + POP-UP DE IMPRESSÃO
// ===============================
function gerarEtiqueta(index) {
  try {
    var lista = carregarEstoque();
    var item = lista[index];
    if (!item) { alert("Item não encontrado."); return; }

    var texto = formatarEtiqueta(item).replace(/\r\n/g,"\n").replace(/\n\n+/g,"\n").trim();

    var w = window.open("", "_blank", "width=500,height=360,top=100,left=100,resizable=no,toolbar=no,location=no,status=no,menubar=no");
    if (!w) { alert("Pop-up bloqueado. Ative pop-ups e tente novamente."); return; }

    var initial = "<!doctype html><html><head><meta charset='utf-8'><title>Etiqueta</title></head><body><div id='root'></div></body></html>";

    w.document.open();
    w.document.write(initial);
    w.document.close();

    if (typeof kjua === "undefined") {
      console.error("kjua não encontrada.");
      w.document.getElementById("root").innerText = "Erro: kjua não encontrada.";
      return;
    }

    var svgEl;
    try {
      svgEl = kjua({
        text: texto,
        render: 'svg',
        ecLevel: 'L',
        crisp: true,
        size: 400,
        quiet: 1
      });
    } catch (e) {
      console.error("Erro ao gerar SVG com kjua:", e);
      w.document.getElementById("root").innerText = "Erro ao gerar QR.";
      return;
    }

    var svgXml = "";
    try {
      var serializer = new XMLSerializer();
      svgXml = serializer.serializeToString(svgEl);
    } catch (e) {
      console.error("Erro ao serializar SVG:", e);
      try {
        var root = w.document.getElementById("root");
        root.innerHTML = "";
        root.appendChild(w.document.importNode(svgEl, true));
      } catch (err2) {
        console.error("Fallback de inserção falhou:", err2);
        w.document.getElementById("root").innerText = "Erro ao inserir QR.";
        return;
      }
      insertRemaining(w, texto);
      return;
    }

    var etiquetaCss = `
      body {
        margin: 0;
        padding: 4mm;
        font-family: Arial, Helvetica, sans-serif;
        width: 70mm;
        box-sizing: border-box;
      }
      /* container com posição relativa para permitir logo fixa no canto */
      .label-container {
        display: flex;
        gap: 6mm;
        align-items: flex-start;
        width: 100%;
        position: relative;
        padding-right: 18mm; /* espaço para a logo não sobrepor conteúdo */
      }
      .info {
        flex: 1;
        font-size: 11px;
        line-height: 1.2;
        word-break: break-word;
        white-space: pre-wrap;
        text-align: left;
      }
      .middle {
        width: 28mm;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .qr { width: 28mm; height: 28mm; display:flex; align-items:center; justify-content:center; }
      .qr img, .qr svg { width:100%; height:100%; display:block; }
      .logo { position: absolute; right: 4mm; top: 4mm; width: 14mm; display:flex; align-items:flex-start; justify-content:flex-end; }
      .logo img { width:14mm; height:auto; transform: rotate(-20deg); object-fit:contain; display:block; opacity:0.95; }
      .print-btn {
        display: block;
        margin-top: 6mm;
        padding: 8px;
        background: green;
        color: #fff;
        border: 0;
        font-size: 14px;
        border-radius: 6px;
        width: 100%;
        cursor: pointer;
      }
      @media print {
        .print-btn { display: none; }
      }
    `;

    var finalHtml = "<!doctype html><html><head><meta charset='utf-8'><title>Etiqueta</title><style>" + etiquetaCss + "</style></head><body>";
    finalHtml += "<div class='label-container'>";
    finalHtml += "<div class='info'>" + escapeHtml(texto).replace(/\n/g,"<br>") + "</div>";
    finalHtml += "<div class='middle'><div class='qr'>" + svgXml + "</div></div>";
    finalHtml += "<div class='logo'><img src='https://3brasseurs.com.br/wp-content/uploads/2023/04/logo-3-brasseurs.png' alt='Logo'></div>";
    finalHtml += "</div><button class='print-btn' onclick='window.print()'>Imprimir</button></body></html>";

    w.document.open();
    w.document.write(finalHtml);
    w.document.close();

    try { w.focus(); } catch (e) {}

    function insertRemaining(win, textoStr) {
      try {
        var root = win.document.getElementById("root");
        if (!root) {
          win.document.body.innerHTML = "<div id='root'></div>";
          root = win.document.getElementById("root");
        }
        // Monta a estrutura com container relativo para permitir logo no canto
        root.innerHTML = "<div class='label-container' style='position:relative;padding-right:18mm;'></div>";
        var cont = win.document.querySelector('.label-container');
        var info = win.document.createElement('div');
        info.className = 'info';
        info.style.fontSize = '11px';
        info.innerHTML = escapeHtml(textoStr).replace(/\n/g,'<br>');
        cont.appendChild(info);

        var middle = win.document.createElement('div');
        middle.className = 'middle';
        middle.style.width = '28mm';
        try { middle.appendChild(win.document.importNode(svgEl, true)); } catch(e){ console.error('insertRemaining append failed', e); }
        cont.appendChild(middle);

        var logo = win.document.createElement('div');
        logo.className = 'logo';
        logo.style.position = 'absolute';
        logo.style.right = '4mm';
        logo.style.top = '4mm';
        var img = win.document.createElement('img');
        img.src = 'https://3brasseurs.com.br/wp-content/uploads/2023/04/logo-3-brasseurs.png';
        img.alt = 'Logo';
        img.style.width = '14mm';
        img.style.transform = 'rotate(-20deg)';
        logo.appendChild(img);
        cont.appendChild(logo);

        var btn = win.document.createElement("button");
        btn.className = "print-btn";
        btn.onclick = function(){ win.print(); };
        btn.innerText = "Imprimir";
        win.document.body.appendChild(btn);
      } catch (err) {
        console.error("insertRemaining geral falhou:", err);
      }
    }

  } catch (errOuter) {
    console.error("gerarEtiqueta erro externo:", errOuter);
    alert("Erro ao gerar etiqueta. Veja console.");
  }
}

// ===============================
// ETIQUETAS (CRUD, impressão em grupo, exclusão em grupo)
// ===============================

let etiquetasAtual = [];

function renderizarEtiquetas() {
    var tbody = document.getElementById("lista-etiquetas");
    if (!tbody) return;
    var html = "";
    for (var i = 0; i < etiquetasAtual.length; i++) {
        var it = etiquetasAtual[i];
        html += "<tr>";
        html += "<td><input type='checkbox' class='chk-etq' data-id='" + it.id + "'></td>";
        html += "<td>" + escapeHtml(it.nome || "") + "</td>";
        html += "<td>" + escapeHtml(String(it.quantidade || "")) + "</td>";
        html += "<td>" + escapeHtml(it.peso || "") + "</td>";
        html += "<td>" + escapeHtml(formatarData(it.dataCriacao)) + "</td>";
        html += "<td>" + escapeHtml(formatarData(it.validade)) + "</td>";
        html += "<td>" + escapeHtml(it.responsavel || "") + "</td>";
        var remDisabled = isAuthorized() ? "" : " disabled ";
        html += "<td><button onclick=\"imprimirEtiquetaPorId('" + it.id + "')\">Imprimir</button> <button onclick=\"excluirEtiqueta('" + it.id + "')\" " + remDisabled + ">Remover</button></td>"; 
        html += "</tr>";
    }
    tbody.innerHTML = html;
}

function iniciarListenerEtiquetas() {
    if (!db) { console.warn("Listener etiquetas não iniciado: Firestore indisponível."); return; }
    db.collection("etiquetas").orderBy("dataCriacao", "desc").onSnapshot(function(snapshot) {
        var lista = [];
        snapshot.forEach(function(doc) {
            var data = doc.data() || {};
            lista.push({
                id: doc.id,
                nome: data.nome || "",
                quantidade: data.quantidade || 0,
                peso: data.peso || "",
                responsavel: data.responsavel || "",
                validade: data.validade || "",
                validade_horas: data.validade_horas || 0,
                estoqueId: data.estoqueId || "",
                dataCriacao: data.dataCriacao || ""
            });
        });
        etiquetasAtual = lista;
        renderizarEtiquetas();
    }, function(error) {
        console.error("Erro ao ouvir etiquetas em tempo real:", error);
    });
}

function popularSelectProdutos() {
    var sel = document.getElementById("select-produto");
    if (!sel) return;
    var lista = carregarEstoque();
    var html = "<option value=''>-- Selecionar produto (ou digite o nome) --</option>";
    for (var i = 0; i < lista.length; i++) {
        var it = lista[i];
        html += "<option value='" + (it.id || "") + "' data-nome='" + escapeHtml(it.nome || "") + "' data-data='" + escapeHtml(it.data || "") + "' data-quantidade='" + escapeHtml(String(it.quantidade || "")) + "'>" + escapeHtml(it.nome) + " (Qtd: " + escapeHtml(String(it.quantidade || "")) + ", Data: " + escapeHtml(formatarData(it.data)) + ")</option>";
    }
    sel.innerHTML = html;
}

function onProdutoSelecionado() {
    var sel = document.getElementById("select-produto");
    if (!sel) return;
    var opt = sel.options[sel.selectedIndex];
    if (!opt) return;
    var nome = opt.getAttribute('data-nome') || opt.text;
    document.getElementById("nome-etiqueta").value = nome;
}

function setValidityHours(h) {
    var el = document.getElementById("validade-horas");
    if (!el) return;
    el.value = h;
}

function toggleTodos(chk) {
    var all = document.querySelectorAll('.chk-etq');
    for (var i = 0; i < all.length; i++) {
        all[i].checked = chk.checked;
    }
}

function criarEtiquetaFromForm() {
    if (!db) { alert("Banco de dados não inicializado."); return; }
    if (!isAuthorized()) { alert('Acesso negado: somente pessoal autorizado pode criar etiquetas que alteram o estoque.'); return; }
    var sel = document.getElementById("select-produto");
    var estoqueId = sel ? sel.value : "";
    var nome = document.getElementById("nome-etiqueta").value.trim();
    var qtd = parseFloat(document.getElementById("quant-etiqueta").value);
    var peso = parseFloat(document.getElementById("peso-etiqueta").value);
    var responsavel = document.getElementById("resp-etiqueta").value.trim();
    var horas = parseInt(document.getElementById("validade-horas").value) || 0;

    if (!estoqueId) {
        if (!nome) { alert("Selecione um produto ou digite o nome"); return; }
        var match = null;
        var lista = carregarEstoque();
        for (var i = 0; i < lista.length; i++) {
            if ((lista[i].nome || "").trim().toLowerCase() === nome.toLowerCase()) { match = lista[i]; break; }
        }
        if (!match) { alert("Produto não encontrado no estoque. Não é possível criar etiqueta."); return; }
        estoqueId = match.id;
        nome = match.nome;
    } else {
        var opt = sel.options[sel.selectedIndex];
        nome = opt ? opt.getAttribute('data-nome') || nome : nome;
    }

    if (!nome || isNaN(qtd) || qtd <= 0) { alert("Informe nome e quantidade válida."); return; }

    var listaEst = carregarEstoque();
    var itemEst = null;
    for (var i = 0; i < listaEst.length; i++) {
        if (listaEst[i].id === estoqueId) { itemEst = listaEst[i]; break; }
    }
    if (!itemEst) { alert("Produto do estoque não encontrado."); return; }
    if (qtd > itemEst.quantidade) { alert("Quantidade solicitada maior que disponível no estoque."); return; }
    if (isNaN(peso) || peso < 0) { peso = 0; }
    if (peso > parseFloat(itemEst.peso || 0)) { alert("Peso solicitado maior que disponível no estoque."); return; }

    var validadeDate = new Date();
    validadeDate.setHours(validadeDate.getHours() + (isNaN(horas) ? 0 : horas));

    var etiquetaObj = {
        nome: nome,
        quantidade: qtd,
        peso: peso,
        responsavel: responsavel,
        validade_horas: horas,
        validade: validadeDate.toISOString(),
        estoqueId: estoqueId,
        dataCriacao: new Date().toISOString()
    };

    db.runTransaction(function(tx) {
        var estRef = db.collection("estoque").doc(estoqueId);
        return tx.get(estRef).then(function(estDoc) {
            if (!estDoc.exists) throw "Estoque removido.";
            var estData = estDoc.data();
            var novoQtd = (parseFloat(estData.quantidade || 0) - qtd);
            var novoPeso = (parseFloat(estData.peso || 0) - peso);
            if (novoQtd < 0 || novoPeso < 0) throw "Quantidade/Peso insuficientes no estoque.";
            var etiquetasRef = db.collection("etiquetas").doc();
            tx.set(etiquetasRef, etiquetaObj);
            tx.update(estRef, { quantidade: novoQtd, peso: novoPeso });
            return true;
        });
    }).then(function() {
        document.getElementById("nome-etiqueta").value = "";
        document.getElementById("quant-etiqueta").value = "";
        document.getElementById("peso-etiqueta").value = "";
        document.getElementById("resp-etiqueta").value = "";
        document.getElementById("validade-horas").value = "";
        if (document.getElementById("select-produto")) document.getElementById("select-produto").selectedIndex = 0;
        alert("Etiqueta criada e estoque atualizado.");
    }).catch(function(e) {
        console.error("Erro ao criar etiqueta:", e);
        alert("Erro ao criar etiqueta: " + e);
    });
}

function excluirEtiqueta(id) {
    if (!db) return;
    if (!isAuthorized()) { alert('Acesso negado: somente pessoal autorizado pode excluir etiquetas.'); return; }
    if (!confirm("Remover etiqueta?")) return;
    db.collection("etiquetas").doc(id).delete().catch(function(e) { console.error(e); alert("Erro ao remover etiqueta."); });
}

function imprimirEtiquetaPorId(id) {
    var it = null;
    for (var i = 0; i < etiquetasAtual.length; i++) { if (etiquetasAtual[i].id === id) { it = etiquetasAtual[i]; break; } }
    if (!it) { alert("Etiqueta não encontrada."); return; }

    var texto = formatarEtiqueta(it).replace(/\r\n/g, "\n").replace(/\n\n+/g, "\n").trim();
    var w = window.open("", "_blank", "width=600,height=800,top=100,left=100,resizable=yes,toolbar=no,location=no,status=no,menubar=no");
    if (!w) { alert("Pop-up bloqueado. Ative pop-ups e tente novamente."); return; }

    var svgXml = "";
    try {
        var svgEl = kjua({ text: texto, render: 'svg', ecLevel: 'L', size: 300, quiet: 1 });
        var serializer = new XMLSerializer();
        svgXml = serializer.serializeToString(svgEl);
    } catch (e) {
        console.error("Erro ao gerar QR:", e);
    }

    var body = "<!doctype html><html><head><meta charset='utf-8'><title>Etiqueta</title><style>body{font-family:Arial;padding:8mm;} .etq{border:1px solid #ddd;padding:8px;margin-bottom:8px;} .label-container{display:flex;gap:12px;align-items:flex-start;position:relative;padding-right:56px;} .info{flex:1;font-size:12px;} .middle{width:120px;display:flex;align-items:center;justify-content:center;} .logo{position:absolute;right:8px;top:8px;width:48px;} .logo img{width:48px;transform:rotate(-20deg);}</style></head><body>";
    body += "<div class='etq'><div class='label-container'><div class='info'>" + escapeHtml(texto).replace(/\n/g, "<br>") + "</div><div class='middle'>" + svgXml + "</div><div class='logo'><img src='https://3brasseurs.com.br/wp-content/uploads/2023/04/logo-3-brasseurs.png' alt='Logo'></div></div></div>";
    body += "<button onclick='window.print()'>Imprimir</button></body></html>";

    w.document.open(); w.document.write(body); w.document.close();
}

function imprimirSelecionadas() {
    var checks = document.querySelectorAll('.chk-etq:checked');
    if (!checks || checks.length === 0) { alert('Nenhuma etiqueta selecionada.'); return; }
    var ids = [];
    for (var i = 0; i < checks.length; i++) ids.push(checks[i].getAttribute('data-id'));

    var itens = etiquetasAtual.filter(function(it) { return ids.indexOf(it.id) !== -1; });
    if (!itens || itens.length === 0) { alert('Itens não encontrados.'); return; }

    var w = window.open("", "_blank", "width=800,height=1000,top=100,left=100,resizable=yes,toolbar=no,location=no,status=no,menubar=no");
    if (!w) { alert("Pop-up bloqueado."); return; }

    var html = "<!doctype html><html><head><meta charset='utf-8'><title>Etiquetas</title><style>body{font-family:Arial;padding:8mm;} .etq{border:1px solid #ddd;padding:8px;margin-bottom:8px;display:flex;gap:12px;align-items:center;} .info{font-size:12px;}</style></head><body>";

    for (var j = 0; j < itens.length; j++) {
        var itm = itens[j];
        var texto = formatarEtiqueta(itm).replace(/\r\n/g, "\n").replace(/\n\n+/g, "\n").trim();
        var svgXmlLocal = "";
        try {
            var svgLocal = kjua({ text: texto, render: 'svg', ecLevel: 'L', size: 200, quiet: 1 });
            svgXmlLocal = new XMLSerializer().serializeToString(svgLocal);
        } catch (e) { console.error('QR falhou', e); }
        html += "<div class='etq'><div class='label-container' style='position:relative;padding-right:44px;'><div class='info'>" + escapeHtml(texto).replace(/\n/g, "<br>") + "</div><div class='middle'>" + svgXmlLocal + "</div><div class='logo' style='position:absolute;right:8px;top:8px;'><img src='https://3brasseurs.com.br/wp-content/uploads/2023/04/logo-3-brasseurs.png' alt='Logo' style='width:36px;transform:rotate(-20deg);'></div></div></div>";
    }

    html += "<button onclick='window.print()'>Imprimir</button></body></html>";
    w.document.open(); w.document.write(html); w.document.close();
}

function excluirSelecionadas() {
    if (!isAuthorized()) { alert('Acesso negado: somente pessoal autorizado pode excluir etiquetas.'); return; }
    var checks = document.querySelectorAll('.chk-etq:checked');
    if (!checks || checks.length === 0) { alert('Nenhuma etiqueta selecionada.'); return; }
    if (!confirm('Excluir as etiquetas selecionadas?')) return;
    var promises = [];
    for (var i = 0; i < checks.length; i++) {
        var id = checks[i].getAttribute('data-id');
        promises.push(db.collection('etiquetas').doc(id).delete());
    }
    Promise.all(promises).then(function(){ alert('Etiquetas excluídas.'); }).catch(function(e){ console.error(e); alert('Erro ao excluir algumas etiquetas.'); });
}

// ===============================
// FILTRO POR CATEGORIA (SELECT FIXO + PERSISTENTE)
// ===============================
function filtrarPorCategoria() {
    var sel = document.getElementById("filtro-categoria");
    if (!sel) return;
    var categoria = sel.value;
    var lista = carregarEstoque();
    var tbody = document.getElementById("lista-estoque");
    if (!tbody) return;

    renderizarLista(); // desenha tudo

    if (categoria === "todas") return;

    var trs = tbody.getElementsByTagName("tr");

    for (var i = 0; i < lista.length; i++) {
        var it = lista[i];
        var cat = (it.categoria || "").trim().toLowerCase();
        var alvo = categoria.trim().toLowerCase();
        if (cat !== alvo) {
            trs[i].style.display = "none";
        }
    }
}

function salvarCategoriaSelecionada() {
    var sel = document.getElementById("filtro-categoria");
    if (sel) {
        localStorage.setItem("categoriaSelecionada", sel.value);
    }
}

function carregarCategoriaSelecionada() {
    var sel = document.getElementById("filtro-categoria");
    if (!sel) return;

    var salva = localStorage.getItem("categoriaSelecionada");
    if (!salva) {
        sel.value = "todas";
        return;
    }

    var existe = false;
    for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === salva) {
            existe = true;
            break;
        }
    }
    if (existe) {
        sel.value = salva;
        filtrarPorCategoria();
    } else {
        sel.value = "todas";
    }
}

// ===============================
// LEITOR DE QR (CAMERA) + FILTRO
// ===============================
var scannerObj = null;
var scannerAtivo = false;

function abrirScanner() {
    if (scannerAtivo) return;

    if (typeof Html5Qrcode === "undefined") {
        alert("Biblioteca do leitor de QR não carregada.\nVerifique sua conexão.");
        return;
    }

    var cont = document.getElementById("scanner-container");
    var status = document.getElementById("scanner-status");
    if (cont) cont.style.display = "block";
    if (status) status.textContent = "Iniciando câmera...";

    scannerObj = new Html5Qrcode("scanner-reader");

    scannerObj.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        function(decodedText, decodedResult) {
            if (status) status.textContent = "QR lido. Filtrando produto...";
            filtrarPorQr(decodedText);
            fecharScanner();
        },
        function(errorMessage) {
            // erros contínuos ignorados
        }
    ).then(function() {
        scannerAtivo = true;
        if (status) status.textContent = "Aponte a câmera para a etiqueta.";
    }).catch(function(err) {
        console.error("Erro ao iniciar scanner:", err);
        if (status) status.textContent = "Erro ao acessar a câmera.";
    });
}

function fecharScanner() {
    var cont = document.getElementById("scanner-container");
    if (cont) cont.style.display = "none";

    if (!scannerObj) {
        scannerAtivo = false;
        return;
    }

    scannerObj.stop().then(function() {
        scannerObj.clear();
        scannerObj = null;
        scannerAtivo = false;
    }).catch(function(err) {
        console.error("Erro ao parar scanner:", err);
        scannerAtivo = false;
    });
}

function filtrarPorQr(decodedText) {
    var lista = carregarEstoque();
    var normScan = (decodedText || "").replace(/\r\n/g, "\n").trim();
    var idx = -1;

    for (var i = 0; i < lista.length; i++) {
        var t = formatarEtiqueta(lista[i]).replace(/\r\n/g, "\n").trim();
        if (t === normScan) {
            idx = i;
            break;
        }
    }

    if (idx === -1) {
        alert("Produto não encontrado para esse QR.");
        return;
    }

    renderizarLista();

    var tbody = document.getElementById("lista-estoque");
    if (!tbody) return;
    var trs = tbody.getElementsByTagName("tr");

    for (var j = 0; j < trs.length; j++) {
        if (j !== idx) {
            trs[j].style.display = "none";
        } else {
            trs[j].style.display = "";
            trs[j].style.outline = "2px solid #007bff";
        }
    }
}

function limparFiltroQr() {
    renderizarLista();
    carregarCategoriaSelecionada();
}

// ===============================
// LISTENER EM TEMPO REAL DO FIRESTORE
// ===============================
function iniciarListenerEstoque() {
    if (!db) {
        console.warn("Listener não iniciado: Firestore indisponível.");
        return;
    }


    db.collection("estoque")
      .orderBy("nome")
      .onSnapshot(function(snapshot) {
          var lista = [];
          snapshot.forEach(function(doc) {
              var data = doc.data() || {};
              lista.push({
                  id: doc.id,
                  nome: data.nome || "",
                  quantidade: data.quantidade || 0,
                  peso: data.peso || "",
                  data: data.data || "",
                  validade: data.validade || "",
                  responsavel: data.responsavel || "",
                  categoria: data.categoria || ""
              });
          });

          estoqueAtual = lista;
          renderizarLista();
          carregarCategoriaSelecionada();
      }, function(error) {
          console.error("Erro ao ouvir estoque em tempo real:", error);
      });
}

// ===============================
// INICIALIZAÇÃO
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    // Habilita listener de estoque e etiquetas (funciona em qualquer página)
    iniciarListenerEstoque();
    iniciarListenerEtiquetas();

    // Atualiza selects e renderizações iniciais
    popularSelectProdutos();
    renderizarLista();
    renderizarEtiquetas();
    carregarCategoriaSelecionada();

    // Aplica estado de autenticação salvo (se houver)
    try { updateAuthUI(); } catch(e) { }
});
