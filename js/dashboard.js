async function carregarDashboard() {
    // 1. Busca todos os registros
    const { data, error } = await window.supabaseClient
        .from('clientes')
        .select('nome, valor_bruto, valor_liquido, data');

    if (error) {
        console.error("Erro ao carregar dados:", error);
        return;
    }

    // 2. Calcula Total de Clientes Únicos
    const clientesUnicos = new Set(data.map(item => item.nome));
    document.getElementById('total-clientes').innerText = clientesUnicos.size;

    // 3. Calcula valores do mês atual
    const hoje = new Date();

    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");

    const mesAtual = `${ano}-${mes}`;

    const dadosMesAtual = data.filter(item =>
        item.data && item.data.startsWith(mesAtual)
    );

    const totalBruto = dadosMesAtual.reduce(
        (acc, curr) => acc + (parseFloat(curr.valor_bruto) || 0),
        0
    );

    const totalLiquido = dadosMesAtual.reduce(
        (acc, curr) => acc + (parseFloat(curr.valor_liquido) || 0),
        0
    );

    const nomesMeses = [
    "Janeiro", "Fevereiro", "Março", "Abril",
    "Maio", "Junho", "Julho", "Agosto",
    "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    document.getElementById("titulo-mes-atual").textContent =
        `${nomesMeses[hoje.getMonth()]} ${ano}`;

    // 4. Atualiza o HTML
    document.getElementById('mes-bruto').innerText = `R$ ${totalBruto.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    document.getElementById('mes-liquido').innerText = `R$ ${totalLiquido.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
}

document.addEventListener('DOMContentLoaded', carregarDashboard);
//-------------------------------------------------------
async function carregarListaClientes() {

    const { data, error } = await window.supabaseClient
        .from('clientes')
        .select('nome, foto, garantia, garantia_inicio, garantia_fim')
        .order('id', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }
    const mapaClientes = new Map();



    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    data.forEach(cliente => {

        const existente = mapaClientes.get(cliente.nome);

        // Verifica se este registro possui garantia válida
        let garantiaAtiva = false;

        if (
            cliente.garantia &&
            cliente.garantia_fim
        ) {
            const fim = new Date(cliente.garantia_fim);
            fim.setHours(0, 0, 0, 0);

            garantiaAtiva = fim >= hoje;
        }

        if (!existente) {

            cliente.garantia = garantiaAtiva;
            mapaClientes.set(cliente.nome, cliente);

        } else {

            // Mantém a foto caso o registro antigo não tenha
            if (!existente.foto && cliente.foto) {
                existente.foto = cliente.foto;
            }

            // Se qualquer serviço tiver garantia válida,
            // o cliente inteiro fica com garantia.
            if (garantiaAtiva) {
                existente.garantia = true;
            }

        }

    });

    todosClientes = Array.from(mapaClientes.values());

    console.log(
        "Clientes carregados no index:",
        JSON.stringify(todosClientes, null, 2)
    );

    renderizarClientes(todosClientes);
}
//-------------------------------------------------------

function renderizarClientes(lista) {

    const container = document.getElementById('lista-clientes');

    container.innerHTML = lista.map(cliente => {

        const foto = cliente.foto ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(cliente.nome)}&background=random`;

        return `
            <div class="avatar" onclick="window.location.href='cliente.html?nome=${encodeURIComponent(cliente.nome)}'">

                <div class="foto-container">
                    <img src="${foto}" alt="${cliente.nome}">

                    ${cliente.garantia ? '<span class="bolinha-garantia"></span>' : ''}
                </div>

                <p>${cliente.nome}</p>

            </div>
        `;
    }).join('');
}


async function carregarHistoricoMensal() {
    console.log("Conectando ao Supabase para o histórico...");

    const { data, error } = await window.supabaseClient
        .from('clientes')
        .select('valor_bruto, valor_liquido, data');

    if (error) {
        console.error("ERRO DO SUPABASE:", error.message);
        alert("Erro ao buscar dados: " + error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log("Nenhum dado encontrado na tabela 'clientes'.");
        return;
    }

    console.log("Dados recebidos com sucesso:", data);

    const agrupado = data.reduce((acc, item) => {
        if (!item.data) return acc;
        const mes = item.data.substring(0, 7); // Ex: "2026-07"
        if (!acc[mes]) acc[mes] = { bruto: 0, liquido: 0 };
        acc[mes].bruto += (parseFloat(item.valor_bruto) || 0);
        acc[mes].liquido += (parseFloat(item.valor_liquido) || 0);
        return acc;
    }, {});

    const lista = document.querySelector('.lista-historico');
    if (!lista) {
        console.error("Elemento .lista-historico não encontrado no seu HTML!");
        return;
    }

    const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    lista.innerHTML = '';

    Object.keys(agrupado).sort().reverse().forEach(mes => {
        const numMes = parseInt(mes.split('-')[1]);
        const nomeMes = nomesMeses[numMes - 1].toUpperCase();
        
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${nomeMes}</strong> <br> 
            Bruto: R$ ${agrupado[mes].bruto.toLocaleString('pt-BR', {minimumFractionDigits: 2})} | 
            Líquido: <span class="txt-verde">R$ ${agrupado[mes].liquido.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
        `;
        lista.appendChild(li);
    });
}

function atualizarData() {
    const elemento = document.getElementById("data-atual");

    const hoje = new Date();

    const opcoes = {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
    };

    const dataFormatada = hoje.toLocaleDateString("pt-BR", opcoes);

    elemento.textContent = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
}