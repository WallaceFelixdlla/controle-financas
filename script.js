// Configurações
const SUPABASE_URL = 'https://tachagqgxjowcpsxotyw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_19fNju9v4AgImJFV4Oucmg_ByleSoVY'; 

if (!window.supabaseClient) {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// --- Carrega contador de clientes ---
async function carregarDados() {
    const { count, error } = await window.supabaseClient
        .from('clientes')
        .select('*', { count: 'exact', head: true });

    if (!error) {
        const elementoTotal = document.getElementById('total-clientes');
        if (elementoTotal) elementoTotal.innerText = count;
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

    // Montando a cascata (lista) na tela com um visual de "Card" bonito
    container.innerHTML = data.map(item => {
        // Converte a data de AAAA-MM-DD para DD/MM/AAAA para ficar no padrão brasileiro
        const dataFormatada = item.data ? item.data.split('-').reverse().join('/') : 'Data não informada';
        
        return `
            <div style="padding: 15px; margin-bottom: 10px; border: 1px solid #d1d5db; border-radius: 8px; background-color: #f3f4f6;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">
                    <strong style="color: #374151;">📅 ${dataFormatada}</strong>
                    <strong style="color: #059669;">R$ ${item.valor_liquido || '0,00'}</strong>
                </div>
                <div style="color: #4b5563;">
                    <strong>Serviço:</strong> ${item.servico || 'Descrição não informada'}
                </div>
                ${item.equipamento ? `<div style="color: #4b5563; font-size: 0.9em; margin-top: 4px;"><strong>Equip:</strong> ${item.equipamento}</div>` : ''}
            </div>
        `;
    }).join('');
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
            valor_bruto: parseFloat(document.getElementById('valor_bruto').value) || 0,
            valor_liquido: parseFloat(document.getElementById('valor_liquido').value) || 0,
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