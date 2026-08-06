 let linkAnexoSalvo = null; // Variável global para armazenar o link
 let fotoTemporaria = null;

// --- Inicialização única ---

document.addEventListener('DOMContentLoaded', async () => {

    // 1. Pega o nome da URL (ex: cliente.html?nome=Fulano)

    const urlParams = new URLSearchParams(window.location.search);

    const nomeUrl = urlParams.get('nome');


    if (nomeUrl) {

        document.getElementById('nome').value = nomeUrl;


        // Busca os dados (cidade, bairro, whatsapp) do banco

        const { data, error } = await window.supabaseClient
            .from('clientes')
            .select('cidade, bairro, whatsapp, foto')
            .ilike('nome', nomeUrl);

        if (!error && data.length > 0) {

            // Pega o primeiro registro
            const cliente = { ...data[0] };

            // Se existir algum registro com foto, usa ele
            const registroComFoto = data.find(item => item.foto);

            if (registroComFoto) {
                cliente.foto = registroComFoto.foto;
            }

            document.getElementById('cidade').value = cliente.cidade || '';
            document.getElementById('bairro').value = cliente.bairro || '';
            document.getElementById('whatsapp').value = cliente.whatsapp || '';

            if (cliente.foto) {
                document.getElementById('foto-cliente').src = cliente.foto;

                fotoTemporaria = cliente.foto;
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


function toggleServico() {

    const conteudo = document.getElementById('conteudo-servico');

    const titulo = conteudo.previousElementSibling.querySelector('h2');

    if (conteudo.style.display === "none" || conteudo.style.display === "") {

        conteudo.style.display = "block";

        titulo.innerText = "Serviço ▴";

    } else {

        conteudo.style.display = "none";

        titulo.innerText = "Serviço ▾";

    }

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

    const nomeLimpo = nomeCliente
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove acentos
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^\w-]/g, "");

    const nomeArquivo = `${Date.now()}_${nomeLimpo}.${extensao}`;

        const caminho = `clientes/${nomeArquivo}`;

        // Procura a foto antiga do cliente
    const { data: fotosAntigas } = await window.supabaseClient
        .from('clientes')
        .select('foto')
        .eq('nome', nomeCliente)
        .not('foto', 'is', null);

    const fotoAntiga = fotosAntigas?.[0];


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
    console.log(error);
    alert(error.message);
    return;
    }

    // Obtém a URL pública
    const { data } = window.supabaseClient.storage
        .from('fotos-clientes')
        .getPublicUrl(caminho);

    // Atualiza a imagem na tela
    document.getElementById('foto-cliente').src = data.publicUrl;
    fotoTemporaria = data.publicUrl;

    // Salva a URL da foto em todos os registros desse cliente
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

        const {
            data: { user },
            error: erroUsuario
        } = await window.supabaseClient.auth.getUser();

        if (erroUsuario || !user) {
            alert("Você precisa estar logado para salvar um serviço.");
            window.location.href = "login.html";
            return;
        }

        const temGarantia = document.getElementById('tem_garantia').checked;

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
            data: document.getElementById('data_servico').value,

            garantia: temGarantia,
            garantia_inicio: temGarantia
                ? document.getElementById('inicio_garantia').value
                : null,
            garantia_fim: temGarantia
                ? document.getElementById('fim_garantia').value
                : null,

            user_id: user.id,
            foto: fotoTemporaria

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

    atualizarData();

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


function filtrarClientes() {

    const termo = document.getElementById('busca-cliente').value.toLowerCase();

    const filtrados = todosClientes.filter(cliente =>
        cliente.nome.toLowerCase().includes(termo)
    );

    renderizarClientes(filtrados);
}

// Chame no carregamento
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.lista-clientes')) {
        carregarListaClientes();
    }

    if (document.querySelector('.lista-historico')) {
        carregarHistoricoMensal();
    }

    // Página do cliente
    if (document.getElementById('nome')) {
        carregarHistorico();
    }
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
        whatsapp: document.getElementById("whatsapp").value.trim(),
        foto: fotoTemporaria
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

const btnLogout = document.getElementById("btn-logout");

if (btnLogout) {
    btnLogout.addEventListener("click", async () => {

        await window.supabaseClient.auth.signOut();

        window.location.href = "login.html";

    });
}

window.addEventListener("pageshow", (event) => {
    carregarDashboard();
    carregarListaClientes();
    carregarHistoricoMensal();
});

//-------EXLUIR CLIENTE-----------------------------

async function excluirCliente() {

    console.log("DELETE CLICADO");


    const urlParams = new URLSearchParams(window.location.search);
    const nomeCliente = urlParams.get('nome');

    console.log("Cliente:", nomeCliente);


    const { data: { user }, error: erroUsuario } =
        await window.supabaseClient.auth.getUser();


    console.log("Usuário:", user);


    if (!user) {
        alert("Usuário não encontrado");
        return;
    }

//-------------------------------------------
// Função para verificar se a garantia está ativa

    function garantiaAtiva(cliente) {

        if (!cliente.garantia) {
            return false;
        }

        const hoje = new Date();
        const inicio = new Date(cliente.garantia_inicio);
        const fim = new Date(cliente.garantia_fim);

        return hoje >= inicio && hoje <= fim;
    }


// Busca uma foto do cliente
    const { data: fotos } = await window.supabaseClient
        .from('clientes')
        .select('foto')
        .eq('nome', nomeCliente)
        .eq('user_id', user.id)
        .not('foto', 'is', null)
        .limit(1);

    if (fotos && fotos.length > 0) {

        const fotoUrl = fotos[0].foto;

        try {

            const url = new URL(fotoUrl);

            const caminhoArquivo = decodeURIComponent(
                url.pathname.split('/public/fotos-clientes/')[1]
            );

            const { error: erroStorage } =
                await window.supabaseClient.storage
                    .from('fotos-clientes')
                    .remove([caminhoArquivo]);
//---------------------------------------------
            console.log("Caminho que será apagado:", caminhoArquivo);
            console.log("Retorno Storage:", erroStorage);

         /*   if (erroStorage) {
                console.error("Erro ao excluir foto:", erroStorage);
            }
*///---------------------------------------------
        } catch (erro) {
            console.error("Erro ao interpretar URL da foto:", erro);
        }

    }
//--------------------------------------
    const { data, error } = await window.supabaseClient
        .from('clientes')
        .delete()
        .eq('nome', nomeCliente)
        .eq('user_id', user.id)
        .select();


    console.log("Resultado delete:", data);
    console.log("Erro delete:", error);


    if (error) {
        alert(error.message);
        return;
    }


    alert("Cliente excluído!");

    window.location.href = "index.html";
}

//LIGAR O BOTÃO DE EXCLUIR CLIENTE---------------------------------

document.addEventListener('DOMContentLoaded', () => {

    const btnExcluir = document.getElementById('btnExcluirCliente');

    if (btnExcluir) {
        btnExcluir.addEventListener('click', excluirCliente);
    }

});

// Controle da garantia do serviço

const checkboxGarantia = document.getElementById("tem_garantia");
const dadosGarantia = document.getElementById("dados-garantia");


if (checkboxGarantia) {

    checkboxGarantia.addEventListener("change", function () {

        if (this.checked) {

            dadosGarantia.style.display = "block";

        } else {

            dadosGarantia.style.display = "none";

            document.getElementById("inicio_garantia").value = "";
            document.getElementById("fim_garantia").value = "";

        }

    });

}