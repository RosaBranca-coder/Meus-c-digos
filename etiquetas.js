let baseHoras = 72;
const agora = new Date();

function setBase(h) {
  baseHoras = h;
  atualizarTudo();
}

function atualizarTudo() {
  document.querySelectorAll(".etiqueta").forEach(et => {
    const extraItem = parseInt(
      et.querySelector(".extraItem").value || 0
    );
    const extraGlobal = parseInt(
      document.getElementById("extraGlobal").value || 0
    );

    const validade = new Date(
      agora.getTime() +
      (baseHoras + extraGlobal + extraItem) * 60 * 60 * 1000
    );

    et.querySelector(".validade").innerText =
      validade.toLocaleString();
  });
}

function renderEtiquetas() {
  const lista = carregarEstoque();
  const cont = document.getElementById("lista");

  lista.forEach(item => {
    const div = document.createElement("div");
    div.className = "etiqueta";

    const payload = JSON.stringify({
      nome: item.nome,
      categoria: item.categoria
    });

    const qr = kjua({
      text: payload,
      render: "svg",
      size: 200
    });

    div.innerHTML = `
      <strong>${item.nome}</strong><br>
      ${item.categoria}<br>

      <div class="qr"></div>

      Resp:
      <input placeholder="Responsável"><br>

      Extra item (h):
      <input type="number" class="extraItem" value="0" min="0"><br>

      Válido até:
      <div class="validade"></div>
    `;

    div.querySelector(".qr").appendChild(qr);
    cont.appendChild(div);
  });

  atualizarTudo();
}

document.addEventListener("DOMContentLoaded", renderEtiquetas);
