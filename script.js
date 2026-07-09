 let linkAnexoSalvo = null; // Variável global para armazenar o link

// Configurações

const SUPABASE_URL = 'https://tachagqgxjowcpsxotyw.supabase.co';

const SUPABASE_KEY = 'sb_publishable_19fNju9v4AgImJFV4Oucmg_ByleSoVY';


if (!window.supabaseClient) {

    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

}


// --- Inicialização única ---

document.addEventListener('DOMContentLoaded', async () => {

    // 1. Pega o nome da URL (ex: cliente.html?nome=Fulano)

    const urlParams = new URLSearchParams(window.location.search);

    const nomeUrl = urlParams.get('nome');


    if (nomeUrl) {

        document.getElementById('nome').value = nomeUrl;


        // Busca os dados (cidade, bairro, whatsapp) do banco

        const { data } = await window.supabaseClient

            .from('clientes')

            .select('cidade, bairro, whatsapp, foto')

            .ilike('nome', nomeUrl)

            .limit(1)

            .single();


        if (data) {

            // .toUpperCase() garante que o texto fique em CAIXA ALTA

            document.getElementById('cidade').value = data.cidade || '';

            document.getElementById('bairro').value = data.bairro || '';

            document.getElementById('whatsapp').value = data.whatsapp || '';

            if (data.foto) {
            document.getElementById('foto-cliente').src = data.foto;
            }

        }

    }


    // 2. Carrega o total e o histórico de uma vez só

    carregarDados();

    carregarHistorico();

});


// --- Carrega contador de clientes ---

async function carregarDados() {

    // Usamos .select('nome') para pegar todos os nomes

    // E depois filtramos apenas os nomes únicos (distintos)

    const { data, error } = await window.supabaseClient

        .from('clientes')

        .select('nome');


    if (!error && data) {

        // Cria uma lista de nomes únicos (usando um Set)

        const nomesUnicos = new Set(data.map(item => item.nome));

       

        const elementoTotal = document.getElementById('total-clientes');

        if (elementoTotal) {

            // O .size mostra quantos nomes únicos existem, não importa quantos serviços cada um tem

            elementoTotal.innerText = nomesUnicos.size;

        }

    }

}


async function carregarHistorico() {

    const campoNome = document.getElementById('nome');

    if (!campoNome) return;

   

    // O .trim() remove espaços sem querer no final do nome

    const nomeCliente = campoNome.value.trim();

   

    // Se o campo estiver vazio, limpa a lista e para

    const container = document.getElementById('lista-historico');

    if (!nomeCliente) {

        if (container) container.innerHTML = `<p>Digite o nome para ver o histórico...</p>`;

        return;

    }


    // Buscando no banco

    const { data, error } = await window.supabaseClient

        .from('clientes')

        .select('*')

        // Usamos 'ilike' em vez de 'eq' porque o ilike ignora maiúsculas e minúsculas!

        .ilike('nome', nomeCliente)

        .order('data', { ascending: false });


    // Verifica se a área de histórico existe no HTML

    if (!container) {

        console.error("A div 'lista-historico' não foi encontrada no seu cliente.html!");

        return;

    }


    // Se der erro no banco

    if (error) {

        container.innerHTML = `<p style="color:red;">Erro ao buscar dados: ${error.message}</p>`;

        return;

    }


    // Se não achar nenhum serviço para esse nome

    if (data.length === 0) {

        container.innerHTML = `<p>Nenhum serviço encontrado para <strong>${nomeCliente}</strong>.</p>`;

        return;

    }


// Montando a cascata com TODAS as informações

    container.innerHTML = data.map(item => {

        const dataFormatada = item.data ? item.data.split('-').reverse().join('/') : 'Data não informada';

       

        return `

            <div style="padding: 15px; margin-bottom: 12px; border: 1px solid #d1d5db; border-radius: 8px; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">

                <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 2px solid #f3f4f6; padding-bottom: 8px;">

                    <strong style="color: #1f2937;">📅 ${dataFormatada}</strong>

                    <span style="font-weight: bold; color: #059669;">Líquido: R$ ${item.valor_liquido || '0,00'}</span>

                </div>

               

                <div style="margin-bottom: 5px;"><strong>Serviço:</strong> ${item.servico || '-'}</div>

                <div style="margin-bottom: 5px;"><strong>Equipamento:</strong> ${item.equipamento || '-'}</div>

                <div style="margin-bottom: 5px;"><strong>Material:</strong> ${item.material || '-'}</div>

               

                <div style="margin-top: 10px; font-size: 0.9em; color: #6b7280; text-align: right;">

                    Valor Bruto: R$ ${item.valor_bruto || '0,00'}

                </div>

            </div>

        `;

    }).join('');

   

}



function toggleHistorico() {

    const lista = document.getElementById('lista-historico');

    // O título agora é o próprio "h2" que está dentro do cabeçalho clicado

    const titulo = lista.previousElementSibling.querySelector('h2');

   

    if (lista.style.display === "none" || lista.style.display === "") {

        lista.style.display = "block";

        titulo.innerText = "Histórico de Serviços ▴";

    } else {

        lista.style.display = "none";

        titulo.innerText = "Histórico de Serviços ▾";

    }

}

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

    // 3. Calcula valores do mês atual (Julho 2026)
    const mesAtual = "2026-07";
    const dadosMesAtual = data.filter(item => item.data && item.data.startsWith(mesAtual));
    
    const totalBruto = dadosMesAtual.reduce((acc, curr) => acc + (parseFloat(curr.valor_bruto) || 0), 0);
    const totalLiquido = dadosMesAtual.reduce((acc, curr) => acc + (parseFloat(curr.valor_liquido) || 0), 0);

    // 4. Atualiza o HTML
    document.getElementById('mes-bruto').innerText = `R$ ${totalBruto.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    document.getElementById('mes-liquido').innerText = `R$ ${totalLiquido.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
}

// Executa a função quando a página carregar
document.addEventListener('DOMContentLoaded', carregarDashboard);

//------------------------------------------------------------
async function carregarListaClientes() {
    // 1. Busca nomes únicos dos clientes
    const { data, error } = await window.supabaseClient
        .from('clientes')
        .select('nome, foto');

    if (error) {
        console.error("Erro ao buscar clientes:", error);
        return;
    }

    // 2. Remove duplicatas (um cliente pode ter vários serviços)
    const nomesUnicos = [...new Set(data.map(item => item.nome))];
    const container = document.getElementById('container-clientes'); // Certifique-se de ter essa div no HTML

    if (!container) return;

    // 3. Gera o HTML de cada avatar
    container.innerHTML = nomesUnicos.map(nome => {
        const cliente = data.find(item => item.nome === nome);
        const foto = cliente?.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=random`;
        return `
            <div class="avatar-card" onclick="window.location.href='cliente.html?nome=${encodeURIComponent(nome)}'">
                <img src="${foto}" alt="${nome}">
                <p>${nome}</p>
            </div>
        `;
    }).join('');
}

// Chame a função dentro do seu carregamento inicial
document.addEventListener('DOMContentLoaded', () => {
    carregarDashboard(); // A que fizemos antes
    carregarListaClientes(); // A nova para listar os avatares
});
//---------------------------------------------------------------------------
// =====================================================
// FOTO DO CLIENTE
// =====================================================

async function uploadFotoCliente(event) {

    const file = event.target.files[0];

    if (!file) return;

    const nomeCliente = document.getElementById('nome').value.trim();

    if (!nomeCliente) {
        alert("Digite primeiro o nome do cliente.");
        return;
    }

    const extensao = file.name.split('.').pop();

    const nomeArquivo = `${Date.now()}_${nomeCliente
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\wÀ-ÿ-]/g, "")}.${extensao}`;

    const caminho = `clientes/${nomeArquivo}`;

    // Procura a foto antiga do cliente
const { data: fotoAntiga } = await window.supabaseClient
    .from('clientes')
    .select('foto')
    .eq('nome', nomeCliente)
    .not('foto', 'is', null)
    .limit(1)
    .single();


// Se existir uma foto antiga, remove do Storage
if (fotoAntiga?.foto) {

    try {

        const url = new URL(fotoAntiga.foto);

        const caminhoArquivo = decodeURIComponent(
            url.pathname.split('/public/fotos-clientes/')[1]
        );

        await window.supabaseClient.storage
            .from('fotos-clientes')
            .remove([caminhoArquivo]);

    } catch (erro) {
        console.warn("Não foi possível remover a foto antiga.", erro);
    }

}

    // Faz upload da imagem
    const { error } = await window.supabaseClient.storage
        .from('fotos-clientes')
        .upload(caminho, file, {
            upsert: true
        });

    if (error) {
        alert("Erro ao enviar foto:\n" + error.message);
        return;
    }

    // Obtém a URL pública
    const { data } = window.supabaseClient.storage
        .from('fotos-clientes')
        .getPublicUrl(caminho);

    // Atualiza a imagem na tela
    document.getElementById('foto-cliente').src = data.publicUrl;

    // Salva a URL da foto em todos os registros desse cliente
    const { error: erroBanco } = await window.supabaseClient
        .from('clientes')
        .update({
            foto: data.publicUrl
        })
        .eq('nome', nomeCliente);

    if (erroBanco) {
        alert("Erro ao salvar a foto no banco.");
        return;
    }

    alert("Foto atualizada com sucesso!");

}



// --- Salvar Novo Serviço ---

const formCliente = document.getElementById('form-cliente');

if (formCliente) {

    formCliente.addEventListener('submit', async (e) => {

        e.preventDefault();


        const dados = {

            nome: document.getElementById('nome').value,

            cidade: document.getElementById('cidade').value,

            bairro: document.getElementById('bairro').value,

            whatsapp: document.getElementById('whatsapp').value,

            servico: document.getElementById('servico').value,

            equipamento: document.getElementById('equipamento').value,

            material: document.getElementById('material').value,

            valor_bruto: converterParaNumero(document.getElementById('valor_bruto').value),

            valor_liquido: converterParaNumero(document.getElementById('valor_liquido').value),

            data: document.getElementById('data_servico').value

        };


        const { error } = await window.supabaseClient.from('clientes').insert([dados]);


        if (error) {

            alert('Erro ao salvar: ' + error.message);

        } else {

            alert('Serviço salvo com sucesso!');

            document.getElementById('servico').value = '';

            document.getElementById('equipamento').value = '';

            document.getElementById('material').value = '';

            document.getElementById('valor_bruto').value = '';

            document.getElementById('valor_liquido').value = '';

            document.getElementById('data_servico').value = '';

        }

    });

}


// --- Inicialização ---

document.addEventListener('DOMContentLoaded', () => {

    carregarDados();

    carregarHistorico();

});


// Adicione isso ao final do seu script.js

const campoNome = document.getElementById('nome');

if (campoNome) {

    campoNome.addEventListener('blur', carregarHistorico); // Busca assim que sair do campo nome

} 

// Variável global para armazenar os clientes buscados
let todosClientes = [];
//--------------------------------------------------------------------------
async function carregarListaClientes() {
    const { data, error } = await window.supabaseClient
        .from('clientes')
        .select('nome, foto');

    if (error) return;

    // Pega apenas nomes únicos
    // Pega apenas um registro de cada cliente (mantendo a foto)
    todosClientes = data.filter(
        (cliente, index, array) =>
            index === array.findIndex(c => c.nome === cliente.nome)
);

renderizarClientes(todosClientes);
}

function renderizarClientes(lista) {

    const container = document.getElementById('lista-clientes');

    container.innerHTML = lista.map(cliente => {

        const foto = cliente.foto ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(cliente.nome)}&background=random`;

        return `
            <div class="avatar" onclick="window.location.href='cliente.html?nome=${encodeURIComponent(cliente.nome)}'">
                <img src="${foto}" alt="${cliente.nome}">
                <p>${cliente.nome}</p>
            </div>
        `;
    }).join('');
}

function filtrarClientes() {

    const termo = document.getElementById('busca-cliente').value.toLowerCase();

    const filtrados = todosClientes.filter(cliente =>
        cliente.nome.toLowerCase().includes(termo)
    );

    renderizarClientes(filtrados);
}

// Chame no carregamento
document.addEventListener('DOMContentLoaded', () => {
    carregarDashboard();         // Totais do mês atual
    carregarListaClientes();     // Avatares
    carregarHistoricoMensal();   // Histórico mensal

    // Foto do cliente
const foto = document.getElementById("foto-cliente");
const upload = document.getElementById("upload-foto");

if (foto && upload) {

    foto.addEventListener("click", () => {
        upload.click();
    });

    upload.addEventListener("change", uploadFotoCliente);

}

// Botão Atualizar Cadastro
const btnAtualizar = document.getElementById("btn-atualizar-cliente");

const campoBruto = document.getElementById("valor_bruto");
const campoLiquido = document.getElementById("valor_liquido");

if (campoBruto) {
    campoBruto.addEventListener("blur", () => formatarMoeda(campoBruto));
}

if (campoLiquido) {
    campoLiquido.addEventListener("blur", () => formatarMoeda(campoLiquido));
}

if (btnAtualizar) {
    btnAtualizar.addEventListener("click", atualizarCadastroCliente);
}

});
//-------------------------------------------------------------------------

// --- CÓDIGO DO HISTÓRICO MENSAL ---

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

async function atualizarCadastroCliente() {

    const nomeOriginal = new URLSearchParams(window.location.search).get("nome");

    if (!nomeOriginal) {
        alert("Cliente não encontrado.");
        return;
    }

    const dados = {
        nome: document.getElementById("nome").value.trim(),
        cidade: document.getElementById("cidade").value.trim(),
        bairro: document.getElementById("bairro").value.trim(),
        whatsapp: document.getElementById("whatsapp").value.trim()
    };

    const { error } = await window.supabaseClient
        .from("clientes")
        .update(dados)
        .eq("nome", nomeOriginal);

    if (error) {
        alert("Erro ao atualizar cadastro:\n" + error.message);
        return;
    }

    alert("Cadastro atualizado com sucesso!");

}

// =====================================================
// FORMATAÇÃO DE MOEDA
// =====================================================

function formatarMoeda(input) {

    let valor = input.value.replace(/\./g, "").replace(",", ".");

    if (valor === "") return;

    let numero = parseFloat(valor);

    if (isNaN(numero)) {
        input.value = "";
        return;
    }

    input.value = numero.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

}

function converterParaNumero(valor) {

    return parseFloat(
        valor.replace(/\./g, "").replace(",", ".")
    ) || 0;

}