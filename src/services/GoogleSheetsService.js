const { google } = require('googleapis');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const ContratadasConfig = require('../utils/contratadasConfig');

const MEDICOES_HEADERS = [
  'id_Medicao', 'data_Medicao', 'Contratada', 'CNPJ_Contratada', 'Contratante',
  'Servico_Contratado', 'n_Centro_Custo', 'n_Pedido', 'mes_Medicao', 'ano_Medicao',
  'n_Medicao', 'Periodo', 'data_Inicio', 'vencimento_NF', 'Total', 'Usuario'
];

const SERVICOS_HEADERS = [
  'id_Medicao', 'id_Servico', 'Descricao', 'Quantidade', 'medindo_Atual',
  'medido_Anterior', 'preco_Unitario'
];

const CONTRATADAS_HEADERS = ['id', 'nome', 'cnpj', 'dataCadastro'];

class GoogleSheetsService {
  // Cache para cabecalhos por spreadsheet
  static headersCache = new Map();
  static CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutos
  
  static getSpreadsheetId() {
    if (process.env.GOOGLE_SHEET_ID) return process.env.GOOGLE_SHEET_ID;
    const match = process.env.GOOGLE_SHEET_URL?.match(/\/spreadsheets\/d\/([^/]+)/);
    return match?.[1] || '';
  }

  static isConfigured() {
    return Boolean(this.getSpreadsheetId() && (
      process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    ));
  }

  static async getClient() {
    if (!this.isConfigured()) return null;

    const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
      ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
      : undefined;
    const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS
      ? path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS)
      : undefined;

    if (!credentials && (!keyFile || !fs.existsSync(keyFile))) {
      throw new Error(
        `Credenciais do Google não encontradas. Adicione o arquivo em ${keyFile || 'GOOGLE_APPLICATION_CREDENTIALS'}.`
      );
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: credentials ? undefined : keyFile,
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    return google.sheets({ version: 'v4', auth });
  }

  static isCacheValido(spreadsheetId) {
    const cached = this.headersCache.get(spreadsheetId);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_TIMEOUT;
  }

  static async garantirCabecalhos(sheets) {
    const spreadsheetId = this.getSpreadsheetId();
    
    // Verificar cache
    if (this.isCacheValido(spreadsheetId)) {
      console.log('[⚡] Cache de cabecalhos válido, pulando verificação');
      return;
    }

    // Buscar informações da planilha
    const planilha = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties.title'
    });
    const abas = new Set((planilha.data.sheets || []).map(sheet => sheet.properties.title));
    const nomesAbas = ['Medicoes', 'MedicaoServicos', 'Contratadas'];

    // Preparar requisições de criação de abas faltantes
    const abasParaCriar = nomesAbas.filter(aba => !abas.has(aba));
    if (abasParaCriar.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: abasParaCriar.map(nomeAba => ({
            addSheet: { properties: { title: nomeAba } }
          }))
        }
      });
    }

    // Verificar cabecalhos em paralelo
    const ranges = [
      { range: 'Medicoes!A1:P1', headers: MEDICOES_HEADERS },
      { range: 'MedicaoServicos!A1:G1', headers: SERVICOS_HEADERS },
      { range: 'Contratadas!A1:D1', headers: CONTRATADAS_HEADERS }
    ];

    const verificacoes = await Promise.all(
      ranges.map(item => 
        sheets.spreadsheets.values.get({
          spreadsheetId,
          range: item.range
        }).then(resposta => ({
          range: item.range,
          headers: item.headers,
          temCabecalho: resposta.data.values?.length > 0
        }))
      )
    );

    // Preparar atualizações de cabecalhos faltantes
    const atualizacoes = verificacoes
      .filter(v => !v.temCabecalho)
      .map(v => ({
        range: v.range,
        majorDimension: 'ROWS',
        values: [v.headers]
      }));

    // Se houver atualizações, fazer tudo em um batchUpdate
    if (atualizacoes.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: { data: atualizacoes, valueInputOption: 'RAW' }
      });
    }

    // Verificar e adicionar contratadas em paralelo (sem bloquear)
    const contratadasResposta = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Contratadas!A2:D'
    });

    if (!contratadasResposta.data.values?.length) {
      const contratadas = ContratadasConfig.obterTodos();
      if (contratadas.length) {
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: 'Contratadas!A:D',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: contratadas.map(contratada => [
              contratada.id || `CONTRATADA_${crypto.randomUUID()}`,
              contratada.nome,
              contratada.cnpj,
              contratada.dataCadastro || new Date().toISOString()
            ])
          }
        });
      }
    }

    // Marcar cache como válido
    this.headersCache.set(spreadsheetId, { timestamp: Date.now() });
  }

  static async listarContratadas() {
    const sheets = await this.getClient();
    if (!sheets) return ContratadasConfig.obterTodos();

    const spreadsheetId = this.getSpreadsheetId();
    await this.garantirCabecalhos(sheets);
    const resposta = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Contratadas!A2:D'
    });

    return (resposta.data.values || []).map(linha => ({
      id: linha[0] || '',
      nome: linha[1] || '',
      cnpj: linha[2] || '',
      dataCadastro: linha[3] || ''
    }));
  }

  static async adicionarContratada(nome, cnpj) {
    const sheets = await this.getClient();
    if (!sheets) return null;

    const contratadas = await this.listarContratadas();
    const cnpjNormalizado = cnpj.replace(/\D/g, '');
    if (contratadas.some(contratada => contratada.cnpj.replace(/\D/g, '') === cnpjNormalizado)) {
      return false;
    }

    const contratada = {
      id: `CONTRATADA_${Date.now()}`,
      nome: nome.toUpperCase(),
      cnpj,
      dataCadastro: new Date().toISOString()
    };
    await sheets.spreadsheets.values.append({
      spreadsheetId: this.getSpreadsheetId(),
      range: 'Contratadas!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[contratada.id, contratada.nome, contratada.cnpj, contratada.dataCadastro]]
      }
    });
    return contratada;
  }

  static async gerarProximoId(sheets) {
  const spreadsheetId = this.getSpreadsheetId();
  const ano = new Date().getFullYear();
  const prefixo = `BM-${ano}-`;

  const resposta = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Medicoes!A2:A'
  });

  const numeros = (resposta.data.values || [])
    .map(linha => linha[0])
    .filter(id => id?.startsWith(prefixo))
    .map(id => Number(id.replace(prefixo, '')))
    .filter(numero => Number.isInteger(numero));

  const proximoNumero = numeros.length ? Math.max(...numeros) + 1 : 1;

  return `${prefixo}${String(proximoNumero).padStart(3, '0')}`;
}
  static async salvar(dados) {
    const sheets = await this.getClient();
    if (!sheets) return null;
    const spreadsheetId = this.getSpreadsheetId();

    await this.garantirCabecalhos(sheets);
    const idMedicao = dados.idMedicao || await this.gerarProximoId(sheets);
    const servicos = (dados.servicos || []).map(servico => ({
      ...servico,
      idMedicao,
      idServico: servico.idServico || `SERV-${crypto.randomUUID()}`
    }));
    const total = servicos.reduce((soma, servico) => (
      soma + (Number(servico.quantidadeAtual) * Number(servico.precoUnitario))
    ), 0);

    // Preparar dados para Medicoes
    const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date()).replace(',', '');

    const medicaoData = [[
      idMedicao, dataFormatada,
      dados.contratada, dados.cnpj,
      dados.contratante, dados.objeto,
      dados.numeroProjeto, dados.nPedido || '', dados.mesMedicao || '',
      dados.anoMedicao || '', dados.nMedicao, dados.periodo, dados.dataInicio,
      dados.vencimentoNF, total, dados.usuario || ''
    ]];

    // Preparar dados para Servicos
    const servicosData = servicos.map(servico => [
      idMedicao, servico.idServico, servico.descricao, servico.quantidade,
      servico.quantidadeAtual, servico.quantidadeAnterior, servico.precoUnitario
    ]);

    // Executar ambas as operações em paralelo
    const operacoes = [
      sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Medicoes!A:P',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: medicaoData }
      })
    ];

    if (servicos.length > 0) {
      operacoes.push(
        sheets.spreadsheets.values.append({
          spreadsheetId,
          range: 'MedicaoServicos!A:G',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: servicosData }
        })
      );
    }

    // Executar operações em paralelo
    await Promise.all(operacoes);

    return { idMedicao, servicos, total };
  }

  static async listar() {
    const sheets = await this.getClient();
    if (!sheets) return [];
    const spreadsheetId = this.getSpreadsheetId();
    await this.garantirCabecalhos(sheets);
    const resposta = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Medicoes!A2:P'
    });
    return (resposta.data.values || []).map(linha => this.medicaoFromRow(linha));
  }

  static async buscar(idMedicao) {
    const sheets = await this.getClient();
    if (!sheets) return null;
    const spreadsheetId = this.getSpreadsheetId();
    const medicoes = await this.listar();
    const medicao = medicoes.find(item => item.idMedicao === idMedicao);
    if (!medicao) return null;

    const resposta = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'MedicaoServicos!A2:G'
    });
    medicao.servicos = (resposta.data.values || [])
      .filter(linha => linha[0] === idMedicao)
      .map(linha => ({
        idMedicao: linha[0], idServico: linha[1], descricao: linha[2],
        quantidade: this.converterNumero(linha[3]),
        quantidadeAtual: this.converterNumero(linha[4]),
        quantidadeAnterior: this.converterNumero(linha[5]),
        precoUnitario: this.converterNumero(linha[6])
      }));
    return medicao;
  }

  static converterNumero(valor) {
    if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
    if (typeof valor !== 'string') return 0;

    const texto = valor.trim().replace(/[^\d,.-]/g, '');
    if (!texto) return 0;

    const ultimaVirgula = texto.lastIndexOf(',');
    const ultimoPonto = texto.lastIndexOf('.');
    const numero = ultimaVirgula > ultimoPonto
      ? texto.replace(/\./g, '').replace(',', '.')
      : texto.replace(/,/g, '');

    const resultado = Number(numero);
    return Number.isFinite(resultado) ? resultado : 0;
  }

  static medicaoFromRow(linha) {
    return {
      idMedicao: linha[0] || '',
      dataMedicao: linha[1] || '',
      contratada: linha[2] || '',
      cnpj: linha[3] || '',
      contratante: linha[4] || '',
      objeto: linha[5] || '',
      numeroProjeto: linha[6] || '',
      nPedido: linha[7] || '',
      mesMedicao: linha[8] || '',
      anoMedicao: linha[9] || '',
      nMedicao: linha[10] || '',
      periodo: linha[11] || '',
      dataInicio: linha[12] || '',
      vencimentoNF: linha[13] || '',
      total: linha[14] || '',
      usuario: linha[15] || '',
      servicos: []
    };
  }
}

module.exports = GoogleSheetsService;
