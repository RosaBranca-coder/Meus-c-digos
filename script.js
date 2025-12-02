// ===============================
// CHAVE DE LOCALSTORAGE
// ===============================
var STORAGE_KEY = "estoque_v1";

// ===============================
// ARMAZENAMENTO
// ===============================
function carregarEstoque() {
    try {
        var raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error("Erro ao ler estoque:", e);
        return [];
    }
}

function salvarEstoque(lista) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    } catch (e) {
        console.error("Erro ao salvar estoque:", e);
    }
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
// CRUD DO ESTOQUE
// ===============================
function adicionarItem() {
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

    var lista = carregarEstoque();
    lista.push({
        nome: nome,
        quantidade: quantidade,
        peso: peso,
        data: data,
        validade: validade,
        responsavel: responsavel,
        categoria: categoria
    });

    salvarEstoque(lista);
    limparFormulario();
    renderizarLista();
    carregarCategoriaSelecionada(); // reaplica filtro se houver
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
    var lista = carregarEstoque();
    if (index < 0 || index >= lista.length) return;
    lista.splice(index, 1);
    salvarEstoque(lista);
    renderizarLista();
    carregarCategoriaSelecionada();
}

function editarItem(index) {
    var lista = carregarEstoque();
    var it = lista[index];
    if (!it) return;

    document.getElementById("item").value = it.nome || "";
    document.getElementById("quantidade").value = it.quantidade || "";
    document.getElementById("peso").value = it.peso || "";
    document.getElementById("data").value = it.data || "";
    document.getElementById("validade").value = it.validade || "";
    document.getElementById("responsavel").value = it.responsavel || "";
    document.getElementById("categoria").value = it.categoria || "";

    lista.splice(index, 1);
    salvarEstoque(lista);
    renderizarLista();
    carregarCategoriaSelecionada();
}

// ===============================
// GERAÇÃO DE ETIQUETA + POP-UP DE IMPRESSÃO
// ===============================
function gerarEtiqueta(index) {
    var lista = carregarEstoque();
    var item = lista[index];
    if (!item) {
        alert("Item não encontrado.");
        return;
    }

    if (typeof QRCode === "undefined") {
        alert("Biblioteca de QRCode não carregada.\nVerifique sua conexão com a internet.");
        return;
    }

    var texto = formatarEtiqueta(item);
    var temp = document.getElementById("qr-temp");
    if (!temp) {
        alert("Elemento #qr-temp não encontrado no HTML.");
        return;
    }
    temp.innerHTML = "";

    try {
        new QRCode(temp, {
            text: texto,
            width: 140,
            height: 140,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.L
        });
    } catch (e) {
        console.error("Erro ao gerar QRCode:", e);
        alert("Erro ao gerar QRCode. O texto pode estar grande demais.");
        return;
    }

    setTimeout(function () {
        var img = temp.querySelector("img") || temp.querySelector("canvas");
        var dataUrl = "";

        if (img) {
            if (img.tagName && img.tagName.toLowerCase() === "img") {
                dataUrl = img.src;
            } else if (typeof img.toDataURL === "function") {
                dataUrl = img.toDataURL("image/png");
            }
        }

        var w = window.open(
            "",
            "popupEtiqueta",
            "width=500,height=320,top=100,left=100,resizable=no,toolbar=no,location=no,status=no,menubar=no"
        );
        if (!w) {
            alert("Não foi possível abrir o pop-up. Desbloqueie pop-ups para este site.");
            return;
        }

        var safeTexto = escapeHtml(texto).replace(/\n/g, "<br>");

        var html = "";
        html += "<html><head><meta charset='utf-8'><title>Etiqueta</title>";
        html += "<style>";
        html += "body{margin:0;padding:4mm;font-family:Arial,sans-serif;width:70mm;height:50mm;}";
        html += ".etq{display:flex;align-items:center;gap:3mm;}";
        html += ".logo{margin-top:-2mm;}";
        html += ".logo img{width:18mm;height:18mm;object-fit:contain;transform:rotate(-20deg);}";
        html += ".qr{margin-top:3mm;}";
        html += ".qr img{width:32mm;height:32mm;object-fit:contain;}";
        html += ".info{font-size:12px;line-height:1.2;max-width:28mm;overflow-wrap:break-word;}";
        html += ".print-btn{margin-top:6px;width:100%;padding:6px;background:#000;color:#fff;border:none;cursor:pointer;border-radius:4px;font-size:14px;}";
        html += "</style></head><body>";

        html += "<div class='etq'>";
        html += "<div class='logo'><img src='https://3brasseurs.com.br/wp-content/uploads/2023/04/logo-3-brasseurs.png' alt='Logo'></div>";
        html += "<div class='qr'>";
        if (dataUrl) {
            html += "<img src='" + dataUrl + "' alt='QR Code'>";
        } else {
            html += "(sem QR)";
        }
        html += "</div>";
        html += "<div class='info'>" + safeTexto + "</div>";
        html += "</div>";
        html += "<button class='print-btn' onclick='window.print()'>Imprimir</button>";

        html += "</body></html>";

        w.document.open();
        w.document.write(html);
        w.document.close();
    }, 300);
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
            // para depois do primeiro sucesso
            fecharScanner();
        },
        function(errorMessage) {
            // erros contínuos ignorados para não poluir
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
// INICIALIZAÇÃO
// ===============================
document.addEventListener("DOMContentLoaded", function () {
    renderizarLista();
    carregarCategoriaSelecionada();
});
