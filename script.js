const STORAGE_KEY = 'estoque_v1';

// Helpers de localStorage
class Storage {
    static isAvailable() {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    static save(key, data) {
        if (!this.isAvailable()) return false;
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Erro ao salvar:', e);
            return false;
        }
    }

    static load(key, defaultValue = null) {
        if (!this.isAvailable()) return defaultValue;
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Erro ao carregar:', e);
            return defaultValue;
        }
    }

    static remove(key) {
        if (!this.isAvailable()) return;
        localStorage.removeItem(key);
    }

    static clear() {
        if (!this.isAvailable()) return;
        localStorage.clear();
    }
}

const EstoqueStorage = {
    salvar(items) { return Storage.save(STORAGE_KEY, items); },
    carregar() { return Storage.load(STORAGE_KEY, []); },
    limpar() { Storage.remove(STORAGE_KEY); }
};

function escapeHtml(text = '') {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Função para formatar data no padrão brasileiro
function formatarData(dataString) {
    if (!dataString) return '';
    try {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return dataString;
    }
}

function renderizarLista() {
    const items = EstoqueStorage.carregar();
    const tbody = document.getElementById('lista-estoque');
    if (!tbody) return;

    tbody.innerHTML = items.map((it, i) => `
        <tr tabindex="0" data-i="${i}">
            <td>${escapeHtml(it.nome)}</td>
            <td>${escapeHtml(String(it.quantidade))}</td>
            <td>${escapeHtml(it.peso || '')}</td>
            <td>${escapeHtml(formatarData(it.data))}</td>
            <td>${escapeHtml(formatarData(it.validade))}</td>
            <td>${escapeHtml(it.responsavel || '')}</td>
            <td class="acoes">
                <button class="btn-editar" data-i="${i}" aria-hidden="true">Editar</button>
                <button class="btn-remover" data-i="${i}" aria-hidden="true">Remover</button>
            </td>
        </tr>
    `).join('');
}

// alterna a classe active em uma linha (para clique/tap)
function toggleActiveRow(tr) {
    if (!tr) return;
    const tbody = tr.parentElement;
    // remove active de outras linhas
    Array.from(tbody.querySelectorAll('tr.active')).forEach(r => {
        r.classList.remove('active');
        r.querySelectorAll('.acoes button').forEach(b => b.setAttribute('aria-hidden','true'));
    });

    const isActive = tr.classList.toggle('active');
    tr.querySelectorAll('.acoes button').forEach(b => b.setAttribute('aria-hidden', isActive ? 'false' : 'true'));
}

function adicionarItem() {
    const nome = document.getElementById('item').value.trim();
    const quantidade = parseFloat(document.getElementById('quantidade').value);
    const peso = document.getElementById('peso').value;
    const data = document.getElementById('data').value;
    const validade = document.getElementById('validade').value;
    const responsavel = document.getElementById('responsavel').value;

    if (!nome || !Number.isFinite(quantidade) || quantidade < 0) {
        alert('Preencha o nome do item e uma quantidade válida.');
        return;
    }

    const lista = EstoqueStorage.carregar();
    lista.push({ nome, quantidade, peso, data, validade, responsavel });
    EstoqueStorage.salvar(lista);
    renderizarLista();

    // limpar campos
    document.getElementById('item').value = '';
    document.getElementById('quantidade').value = '';
    document.getElementById('peso').value = '';
    document.getElementById('data').value = '';
    document.getElementById('validade').value = '';
    document.getElementById('responsavel').value = '';
    document.getElementById('item').focus();
}

function editarItem(index) {
    const lista = EstoqueStorage.carregar();
    const it = lista[index];
    if (!it) return;
    document.getElementById('item').value = it.nome;
    document.getElementById('quantidade').value = it.quantidade;
    document.getElementById('peso').value = it.peso || '';
    document.getElementById('data').value = it.data || '';
    document.getElementById('validade').value = it.validade || '';
    document.getElementById('responsavel').value = it.responsavel || '';
    // remove o item para que seja re-adicionado ao salvar
    lista.splice(index, 1);
    EstoqueStorage.salvar(lista);
    renderizarLista();
    document.getElementById('item').focus();
}

function removerItem(index) {
    const lista = EstoqueStorage.carregar();
    if (index < 0 || index >= lista.length) return;
    lista.splice(index, 1);
    EstoqueStorage.salvar(lista);
    renderizarLista();
}

// Delegação de eventos para editar/remover e toggle de linha
document.addEventListener('click', (e) => {
    const btn = e.target;
    if (btn.matches('.btn-remover')) {
        const i = Number(btn.dataset.i);
        removerItem(i);
        return;
    }
    if (btn.matches('.btn-editar')) {
        const i = Number(btn.dataset.i);
        editarItem(i);
        return;
    }
    // clique em linha => toggle (ajuda em touch)
    const tr = e.target.closest('tr[data-i]');
    if (tr) {
        toggleActiveRow(tr);
    }
});

// permitir abrir/fechar ações com Enter em teclado
document.addEventListener('keydown', (e) => {
    const active = document.activeElement;
    if (active && active.tagName === 'TR' && active.dataset.i !== undefined) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleActiveRow(active);
        }
    }
});

document.addEventListener('DOMContentLoaded', renderizarLista);
