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
        html += "<button onclick='editarItem(" + i + ")'>Editar</button> ";
        html += "<button onclick='removerItem(" + i + ")'>Remover</button> ";
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
      .top-row {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 4mm;
        width: 100%;
      }
      .logo img {
        width: 14mm;
        height: 14mm;
        transform: rotate(-20deg);
        object-fit: contain;
        display: block;
        opacity: 0.9;
      }
      .qr {
        width: 28mm;
        height: 28mm;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .qr img, .qr svg {
        width: 100%;
        height: 100%;
        display: block;
      }
      .info {
        margin-top: 3mm;
        width: 62mm;
        font-size: 11px;
        line-height: 1.2;
        word-break: break-word;
        white-space: pre-wrap;
        text-align: left;
      }
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
        .print-btn {
          display: none;
        }
      }
    `;

    var finalHtml = "<!doctype html><html><head><meta charset='utf-8'><title>Etiqueta</title><style>" + etiquetaCss + "</style></head><body><div class='etq'><div class='logo'><img src='https://3brasseurs.com.br/wp-content/uploads/2023/04/logo-3-brasseurs.png' alt='Logo'></div><div class='qr'>" + svgXml + "</div><div class='info'>" + escapeHtml(texto).replace(/\n/g,"<br>") + "</div><button class='print-btn' onclick='window.print()'>Imprimir</button></div></body></html>";

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
        root.innerHTML = "<div class='etq'><div class='logo'><img src='https://3brasseurs.com.br/wp-content/uploads/2023/04/logo-3-brasseurs.png' alt='Logo' style='width:18mm;height:18mm;transform:rotate(-20deg);object-fit:contain;'></div></div>";
        try {
          root.appendChild(win.document.importNode(svgEl, true));
        } catch(e){ console.error("insertRemaining append failed", e); }
        var info = win.document.createElement("div");
        info.className = "info";
        info.innerHTML = escapeHtml(textoStr).replace(/\n/g,"<br>");
        root.appendChild(info);
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
    if (!document.getElementById("lista-estoque")) {
        // Não estamos na página de estoque
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
    // Se estivermos na página de estoque, habilita listener
    iniciarListenerEstoque();
    // Se não estiver, estas chamadas só não vão achar elementos (e tudo bem)
    renderizarLista();
    carregarCategoriaSelecionada();
});
