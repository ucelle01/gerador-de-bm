
// Estado da aplicação
let servicoAtual = 1;
let ultimoDiaPeriodo = ''; // <-- adicionado

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  const btnAdicionarServico = document.getElementById('adicionar-servico');
  const btnPreview = document.getElementById('btn-preview');
  const btnGerarExcel = document.getElementById('btn-gerar-excel');
  const cnpjInput = document.getElementById('cnpj');
  const newCnpjInput = document.getElementById('new-cnpj');
  const btnNovaContratada = document.getElementById('new-contratada');
  const camposNovaContratada = document.getElementById('new-contratada-fields');
  const btnSalvarNovaContratada = document.getElementById('save-new-contratada');

  btnAdicionarServico.addEventListener('click', adicionarServico);
  btnPreview.addEventListener('click', mostrarPreview);
  btnGerarExcel.addEventListener('click', gerarExcel);

  btnNovaContratada.addEventListener('click', () => {
    const exibir = camposNovaContratada.hidden;
    camposNovaContratada.hidden = !exibir;
    btnNovaContratada.value = exibir
      ? '✖️ Ocultar Cadastro'
      : '➕ Cadastrar Nova Contratada';
    camposNovaContratada.querySelectorAll('input').forEach(input => {
      input.required = exibir;
    });
  });

  btnSalvarNovaContratada.addEventListener('click', salvarNovaContratada);

  // Formatar CNPJ conforme digita
  if (cnpjInput) {
    cnpjInput.addEventListener('input', formatarCNPJ);
  }
  if (newCnpjInput) {
    newCnpjInput.addEventListener('input', formatarCNPJ);
  }
 
  // CORRIGIDO: Carregar contratantes ao iniciar
  carregarContratantes();
  carregarContratadas();

  
  const mesEl = document.getElementById('mesMedicao');
  const anoEl = document.getElementById('anoMedicao');
  const periodoEl = document.getElementById('periodo');

  if (!mesEl || !anoEl || !periodoEl) return;

  // opcional: definir ano atual por padrão
  if (!anoEl.value) anoEl.value = new Date().getFullYear();

  function formatDate(d) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  function lastFiveBusinessDays(monthValue, yearValue) {
    const m = parseInt(monthValue, 10);
    const y = parseInt(yearValue, 10);
    if (isNaN(m) || isNaN(y)) return [];

    // calcular mês anterior
    let prevMonthIndex = (m - 2 + 12) % 12; // 0-11
    let prevYear = (m === 1) ? y - 1 : y;

    // último dia do mês anterior
    const lastDayNum = new Date(prevYear, prevMonthIndex + 1, 0).getDate();
    const days = [];
    for (let d = lastDayNum; d >= 1 && days.length < 5; d--) {
      const date = new Date(prevYear, prevMonthIndex, d);
      const day = date.getDay();
      if (day !== 0 && day !== 6) { // 0 = domingo, 6 = sábado
        days.push(date);
      }
    }
    return days.reverse(); // ordena do mais antigo ao mais recente
  }

  function atualizarPeriodo() {
    const mes = mesEl.value;
    const ano = anoEl.value;
    if (!mes || !ano) {
      periodoEl.value = '';
      ultimoDiaPeriodo = '';
      return;
    }
    const dias = lastFiveBusinessDays(mes, ano);
    if (dias.length === 0) {
      periodoEl.value = '';
      ultimoDiaPeriodo = '';
      return;
    }
    const primeiro = dias[0];
    const ultimo = dias[dias.length - 1];
    periodoEl.value = `${formatDate(primeiro)} a ${formatDate(ultimo)}`;
    // armazena o último dia do período (formatado) para uso ao gerar Excel (cel T7)
    ultimoDiaPeriodo = formatDate(ultimo);
  }

  mesEl.addEventListener('change', atualizarPeriodo);
  anoEl.addEventListener('input', atualizarPeriodo);

  // atualizar ao carregar caso já haja valores
  atualizarPeriodo();
});

function adicionarServico() {
  const container = document.getElementById('servicos-container');
  servicoAtual++;

  const novoServico = document.createElement('div');
  novoServico.className = 'servico-item';
  novoServico.innerHTML = `
    <div class="servico-item-content">
      <div class="form-group">
        <label>Descrição *</label>
        <input type="text" class="descricao" required placeholder="Descrição do serviço">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Quantidade</label>
          <input type="number" class="quantidade" required min="1.00" step="1.00" placeholder="1.00">
        </div>
        <div class="form-group">
          <label>Preço Unitário (R$) *</label>
          <input type="number" class="precoUnitario" required min="0" step="1.00" placeholder="0.00">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Medindo Atualmente</label>
          <input type="number" class="quantidadeAtual" required min="0" step="0.10" placeholder="0.00">
        </div>
        <div class="form-group">
          <label>Medido Anteriormente</label>
          <input type="number" class="quantidadeAnterior" required min="0" step="0.10" placeholder="0.00">
        </div>
      </div>
    </div>
    <button type="button" class="btn-remover-servico" onclick="removerServico(this)">🗑️ Remover Serviço</button>
  `;

  container.appendChild(novoServico);
}
function removerServico(btn) {
  const container = document.getElementById('servicos-container');
  // CORRIGIDO: Não remover se for o último serviço
  if (container.querySelectorAll('.servico-item').length > 1) {
    btn.closest('.servico-item').remove();
    servicoAtual--;
  } else {
    alert('Você deve manter pelo menos um serviço!');
  }
}
function coletarDados() {
  const servicos = [];

  document.querySelectorAll('.servico-item').forEach(item => {
    const descricao = item.querySelector('.descricao').value.trim();
    const quantidade = parseFloat(item.querySelector('.quantidade').value) || 1;
    const quantidadeAtual = parseFloat(item.querySelector('.quantidadeAtual').value) || 0;
    const quantidadeAnterior = parseFloat(item.querySelector('.quantidadeAnterior').value) || 0;
    const precoUnitario = parseFloat(item.querySelector('.precoUnitario').value) || 0;

    if (descricao && quantidade > 0 && precoUnitario >= 0) {
      servicos.push({
        descricao,
        quantidade,
        quantidadeAtual: quantidadeAtual > 0 ? quantidadeAtual : 0,
        quantidadeAnterior: quantidadeAnterior >= 0 ? quantidadeAnterior : 0,
        precoUnitario
      });
    }
  });

  const selectContratante = document.getElementById('contratante');
  const optionSelecionada = selectContratante.options[selectContratante.selectedIndex];
  const logoUrl = optionSelecionada?.dataset?.logo || '';
  const idContratante = optionSelecionada?.dataset?.id || ''; // Obter ID da contratante

  const mesEl = document.getElementById('mesMedicao');
  const anoEl = document.getElementById('anoMedicao');

  const dados = {
    contratada: document.getElementById('contratada').value.trim(),
    cnpj: document.getElementById('cnpj').value.trim(),
    contratante: document.getElementById('contratante').value.trim(),
    idContratante: idContratante, // Incluir ID da contratante
    objeto: document.getElementById('objeto').value.trim(),
    numeroProjeto: document.getElementById('numeroProjeto').value.trim(),
    periodo: document.getElementById('periodo').value.trim(),
    nPedido: document.getElementById('nPedido').value.trim(),
    dataInicio: document.getElementById('dataInicio').value.trim(),
    dataFim: ultimoDiaPeriodo || 'N/A',
    vencimentoNF: document.getElementById('vencimentoNF').value.trim(),
    mesMedicao: mesEl?.value?.trim() || '',
    anoMedicao: anoEl?.value?.trim() || '',
    //logoUrl: logoUrl,
    servicos
  };

  console.log('[DEBUG] Dados coletados:', dados);
  return dados;
}

function validarFormulario() {
  const dados = coletarDados();
  const erros = [];

  if (!dados.contratada) erros.push('Contratada é obrigatória');
  if (!dados.cnpj) erros.push('CNPJ é obrigatório');
  if (!dados.contratante) erros.push('Contratante é obrigatório');
  if (!dados.objeto) erros.push('Objeto é obrigatório');
  if (!dados.numeroProjeto) erros.push('Número do Projeto é obrigatório');
  if (!dados.periodo) erros.push('Período é obrigatório');
  if (!dados.dataInicio) erros.push('Data de Início é obrigatória');
  if (!dados.vencimentoNF) erros.push('Vencimento da NF é obrigatório');
  if (dados.servicos.length === 0) erros.push('Adicione pelo menos um serviço');

  if (erros.length > 0) {
    alert('Erros encontrados:\n' + erros.join('\n'));
    return false;
  }

  return true;
}

async function mostrarPreview() {
  if (!validarFormulario()) return;

  const dados = coletarDados();
  const loading = document.getElementById('loading');
  
  try {
    loading.classList.remove('hidden');

    const response = await fetch('/api/boletim/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });

    if (!response.ok) throw new Error('Erro ao gerar preview');

    const boletim = await response.json();
    exibirPreview(boletim);
  } catch (error) {
    alert('Erro: ' + error.message);
  } finally {
    loading.classList.add('hidden');
  }
}

function exibirPreview(boletim) {
  const modal = document.getElementById('preview-modal');
  const previewContent = document.getElementById('preview-content');

  const total = boletim.servicos.reduce((sum, s) => sum + (s.quantidade * s.precoUnitario), 0);

  let html = `
    <div style="margin-bottom: 20px;">
      <p><strong>Contratada:</strong> ${boletim.contratada}</p>
      <p><strong>CNPJ:</strong> ${boletim.cnpj}</p>
      <p><strong>Contratante:</strong> ${boletim.contratante}</p>
      <p><strong>Objeto:</strong> ${boletim.objeto}</p>
      <p><strong>Período:</strong> ${boletim.periodo}</p>
      <p><strong>Data de Início:</strong> ${boletim.dataInicio}</p>
    </div>

    <table class="preview-table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Descrição</th>
          <th>Qtd</th>
          <th>Preço Unit.</th>
          <th>Subtotal</th>
          <th>Medição</th>
        </tr>
      </thead>
      <tbody>
  `;

  boletim.servicos.forEach((servico, index) => {
    const subtotal = servico.quantidade * servico.precoUnitario;
    html += `
      <tr>
        <td>${index + 1}</td>
        <td>${servico.descricao}</td>
        <td>${servico.quantidade.toFixed(2)}</td>
        <td>R$ ${servico.precoUnitario.toFixed(2)}</td>
        <td>R$ ${subtotal.toFixed(2)}</td>
        <td>${servico.medicaoAtual ? '✓' : '-'}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
    <div style="margin-top: 20px; text-align: right;">
      <h3>Total: R$ ${total.toFixed(2)}</h3>
    </div>
  `;

  previewContent.innerHTML = html;
  modal.classList.add('show');
}

function fecharPreview() {
  const modal = document.getElementById('preview-modal');
  modal.classList.remove('show');
}

async function gerarExcel() {
  if (!validarFormulario()) return;

  const dados = coletarDados();
  const loading = document.getElementById('loading');

  try {
    loading.classList.remove('hidden');

    console.log('[INFO] Enviando para gerar Excel...');
    const response = await fetch('/api/boletim/excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao gerar Excel');
    }

    const blob = await response.blob();
    console.log('[✓] Excel recebido, tamanho:', blob.size, 'bytes');
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `boletim_${new Date().getTime()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    alert('✅ Excel gerado e baixado com sucesso!');
  } catch (error) {
    console.error('[✗] Erro:', error);
    alert('❌ Erro: ' + error.message);
  } finally {
    loading.classList.add('hidden');
  }
}

async function carregarContratantes() {
  try {
    const response = await fetch('/api/boletim/contratantes');
    if (!response.ok) throw new Error('Erro ao carregar contratantes');
    
    const contratantes = await response.json();
    const select = document.getElementById('contratante');
    
    contratantes.forEach(contratante => {
      const option = document.createElement('option');
      option.value = contratante.nome;
      option.textContent = contratante.sigla + ' - ' + contratante.nome;
      option.dataset.nome = contratante.nome;
      option.dataset.id = contratante.id; // Armazenar ID da contratante
      option.dataset.logo = contratante.logo;
      option.dataset.sigla = contratante.sigla;
      select.appendChild(option);
    });
    
    // Adicionar listener para mostrar logo e sigla
    select.addEventListener('change', async (e) => {
      const option = e.target.options[e.target.selectedIndex];
      const info = document.getElementById('contratante-info');
      const logoEl = document.getElementById('contratante-logo');
      const siglaEl = document.getElementById('contratante-sigla');

      if (e.target.value) {
        let logoUrl = option.dataset.logo;
        const sigla = option.dataset.sigla || '';

        // Garantir que começa com /
        if (logoUrl && !logoUrl.startsWith('/')) {
          logoUrl = '/' + logoUrl;
        }

        // tenta verificar existência do logo (HEAD); se falhar usa placeholder SVG
        let logoToUse = null;
        try {
          const head = await fetch(logoUrl, { method: 'HEAD' });
          if (head.ok) {
            logoToUse = logoUrl;
          }
        } catch (err) {
          // ignore — logoToUse permanece null
        }

        if (!logoToUse) {
          // gerar placeholder SVG com a sigla
          const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='100%' height='100%' rx='8' fill='#667eea'/><text x='50%' y='55%' font-family='Arial, sans-serif' font-size='34' fill='white' text-anchor='middle' dominant-baseline='middle'>${sigla}</text></svg>`;
          logoToUse = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        }

        // atribui src e alt; onerror substitui por placeholder
        logoEl.src = logoToUse;
        logoEl.alt = option.dataset.nome || 'Logo';
        siglaEl.textContent = sigla;
        info.classList.add('show');
      } else {
        info.classList.remove('show');
        // limpar src para evitar solicitações desnecessárias
        document.getElementById('contratante-logo').src = '';
        document.getElementById('contratante-sigla').textContent = '';
      }
    });
  } catch (error) {
    console.error('Erro ao carregar contratantes:', error);
  }
}

async function carregarContratadas() {
  try {
    const response = await fetch('/api/boletim/contratadas');
    if (!response.ok) throw new Error('Erro ao carregar contratadas');

    const contratadas = await response.json();
    const select = document.getElementById('contratada');
    const cnpjInput = document.getElementById('cnpj');

    select.querySelectorAll('option:not(:first-child)').forEach(option => option.remove());

    contratadas.forEach(contratada => {
      const option = document.createElement('option');
      option.value = contratada.nome;
      option.textContent = contratada.nome;
      option.dataset.cnpj = contratada.cnpj || '';
      select.appendChild(option);
    });

    select.addEventListener('change', event => {
      const option = event.target.options[event.target.selectedIndex];
      cnpjInput.value = option.dataset.cnpj || '';
    });
  } catch (error) {
    console.error('Erro ao carregar contratadas:', error);
  }
}

async function salvarNovaContratada() {
  const nomeInput = document.getElementById('new-cadastro');
  const cnpjInput = document.getElementById('new-cnpj');
  const nome = nomeInput.value.trim();
  const cnpj = cnpjInput.value.trim();

  if (!nome || !cnpj) {
    alert('Preencha o nome e o CNPJ da contratada.');
    return;
  }

  try {
    const response = await fetch('/api/boletim/contratadas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, cnpj })
    });

    const resultado = await response.json();
    if (!response.ok) throw new Error(resultado.error || 'Erro ao salvar contratada');

    await carregarContratadas();
    const select = document.getElementById('contratada');
    select.value = resultado.nome;
    document.getElementById('cnpj').value = resultado.cnpj;
    nomeInput.value = '';
    cnpjInput.value = '';
    document.getElementById('new-contratada').click();
    alert('Contratada salva com sucesso.');
  } catch (error) {
    console.error('Erro ao salvar contratada:', error);
    alert(error.message);
  }
}

// fallback: se img falhar ao carregar, gerar placeholder (garante que algo aparece)
document.addEventListener('DOMContentLoaded', () => {
  const logoEl = document.getElementById('contratante-logo');
  if (logoEl) {
    logoEl.addEventListener('error', () => {
      const sigla = document.getElementById('contratante-sigla').textContent || '';
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='100%' height='100%' rx='8' fill='#667eea'/><text x='50%' y='55%' font-family='Arial, sans-serif' font-size='34' fill='white' text-anchor='middle' dominant-baseline='middle'>${sigla}</text></svg>`;
      logoEl.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }
});

// Fechar modal ao clicar fora ou no botão X

window.addEventListener('click', (e) => {
  const modal = document.getElementById('preview-modal');
  if (e.target === modal) {
    fecharPreview();
  } 
});

function formatarCNPJ(event) {
  let valor = event.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
  
  if (valor.length > 14) {
    valor = valor.slice(0, 14); // Limita a 14 dígitos
  }
  
  // Aplica o formato: xx.xxx.xxx/xxxx-xx
  if (valor.length <= 2) {
    event.target.value = valor;
  } else if (valor.length <= 5) {
    event.target.value = valor.slice(0, 2) + '.' + valor.slice(2);
  } else if (valor.length <= 8) {
    event.target.value = valor.slice(0, 2) + '.' + valor.slice(2, 5) + '.' + valor.slice(5);
  } else if (valor.length <= 12) {
    event.target.value = valor.slice(0, 2) + '.' + valor.slice(2, 5) + '.' + valor.slice(5, 8) + '/' + valor.slice(8);
  } else {
    event.target.value = valor.slice(0, 2) + '.' + valor.slice(2, 5) + '.' + valor.slice(5, 8) + '/' + valor.slice(8, 12) + '-' + valor.slice(12, 14);
  }


}
