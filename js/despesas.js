// ==========================================================
// despesas.js - Controle de despesas mensais
// ==========================================================

// ---------- Utilidades ----------
const MESES_NOME = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function fmtMoeda(v) {
    return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function hojeISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function escapeHTML(t) {
    const div = document.createElement('div');
    div.textContent = t;
    return div.innerHTML;
}

// ---------- Busca no banco ----------
async function buscarDespesas() {
    const { data, error } = await window.supabaseClient
        .from('despesas')
        .select('id, descricao, valor, data')
        .order('data', { ascending: false });

    if (error) {
        console.error('Erro ao buscar despesas:', error);
        return [];
    }
    return data || [];
}

function somaDespesasDoMes(despesas, mes) {
    return despesas
        .filter(d => d.data && d.data.startsWith(mes))
        .reduce((t, d) => t + (parseFloat(d.valor) || 0), 0);
}

// ---------- Adicionar / remover ----------
async function adicionarDespesa() {
    const descricao = document.getElementById('desp-desc').value.trim();
    const valor = parseFloat(document.getElementById('desp-valor').value.replace(',', '.'));
    const data = document.getElementById('desp-data').value || hojeISO();

    if (!descricao || !(valor > 0)) {
        alert('Preencha a descrição e um valor maior que zero.');
        return;
    }

    const { error } = await window.supabaseClient
        .from('despesas')
        .insert({ descricao, valor, data });

    if (error) {
        alert('Erro ao salvar: ' + error.message);
        return;
    }

    document.getElementById('desp-desc').value = '';
    document.getElementById('desp-valor').value = '';
    atualizarTudo();
}

async function removerDespesa(id) {
    if (!confirm('Remover esta despesa?')) return;

    const { error } = await window.supabaseClient
        .from('despesas')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Erro ao remover: ' + error.message);
        return;
    }
    atualizarTudo();
}

// ---------- Lista de despesas do mês atual ----------
async function carregarDespesasMes() {
    const lista = document.getElementById('lista-despesas');
    if (!lista) return;

    const mesAtual = hojeISO().substring(0, 7);
    const despesas = (await buscarDespesas()).filter(d => d.data.startsWith(mesAtual));

    if (despesas.length === 0) {
        lista.innerHTML = '<li class="desp-vazio">Nenhuma despesa neste mês.</li>';
        return;
    }

    lista.innerHTML = despesas.map(d => {
        const [a, m, dia] = d.data.split('-');
        return `
            <li class="item-despesa">
                <span>${dia}/${m} - ${escapeHTML(d.descricao)}</span>
                <span>
                    <b class="txt-vermelho">${fmtMoeda(parseFloat(d.valor))}</b>
                    <button class="btn-x" onclick="removerDespesa(${d.id})">✕</button>
                </span>
            </li>`;
    }).join('');
}

// ---------- Histórico de despesas (meses encerrados) ----------
async function carregarHistoricoDespesas() {
    const ul = document.getElementById('lista-historico-despesas');
    if (!ul) return;

    const mesAtual = hojeISO().substring(0, 7);
    const despesas = (await buscarDespesas())
        .filter(d => d.data && d.data.substring(0, 7) < mesAtual);

    if (despesas.length === 0) {
        ul.innerHTML = '<li class="desp-vazio">Nenhum mês encerrado ainda.</li>';
        return;
    }

    // Agrupa por mês
    const porMes = {};
    despesas.forEach(d => {
        const mes = d.data.substring(0, 7);
        if (!porMes[mes]) porMes[mes] = { total: 0, itens: [] };
        porMes[mes].total += parseFloat(d.valor) || 0;
        porMes[mes].itens.push(d);
    });

    ul.innerHTML = Object.keys(porMes).sort().reverse().map(mes => {
        const [ano, num] = mes.split('-');
        const nome = MESES_NOME[parseInt(num) - 1].toUpperCase();
        const m = porMes[mes];

        // dentro do mês, do dia 1 para o último
        const itens = m.itens.sort((a, b) => a.data.localeCompare(b.data)).map(d => {
            const dia = d.data.split('-')[2];
            return `
                <div class="linha-desp-hist">
                    <span>${dia}/${num} - ${escapeHTML(d.descricao)}</span>
                    <b class="txt-vermelho">${fmtMoeda(parseFloat(d.valor))}</b>
                </div>`;
        }).join('');

        return `
            <li>
                <details class="mes-desp">
                    <summary>
                        <strong>${nome} ${ano}</strong>
                        <span>Total: <b class="txt-vermelho">${fmtMoeda(m.total)}</b></span>
                    </summary>
                    <div class="itens-desp-hist">${itens}</div>
                </details>
            </li>`;
    }).join('');
}

// ---------- Atualiza todas as partes da tela ----------
function atualizarTudo() {
    carregarDashboard();
    carregarHistoricoMensal();
    carregarDespesasMes();
    carregarHistoricoDespesas();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('desp-data').value = hojeISO();
    document.getElementById('desp-add').addEventListener('click', adicionarDespesa);
    carregarDespesasMes();
    carregarHistoricoDespesas();
});

// Abre a lista de clientes automaticamente ao filtrar
function abrirClientes() {
    const conteudo = document.getElementById('conteudo-clientes');
    const icone = document.getElementById('icone-clientes');
    if (conteudo && !conteudo.classList.contains('aberto')) {
        conteudo.classList.add('aberto');
        icone.classList.add('rotacionar');
    }
}