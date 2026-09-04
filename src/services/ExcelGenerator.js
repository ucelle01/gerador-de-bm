const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

class ExcelGenerator {
  static TEMPLATE_PATH = path.join(__dirname, '../../templates/template_sem_logo.xlsx');
  //static TEMPLATE_PATH_LOGO = path.join(__dirname, `../../templates/template_${idContratante}.xlsx`);
  //static DELAY_MS = 500; // Delay em milissegundos após carregar o template
  /**
   * Seleciona o template apropriado baseado no ID da contratante
   * @param {string} idContratante - ID da contratante
   * @returns {string} Caminho do template a ser utilizado
   */
  static obterCaminhoTemplate(idContratante) {
    console.log('[DEBUG] obterCaminhoTemplate - idContratante recebido:', idContratante, 'Tipo:', typeof idContratante);
    
    if (!idContratante) {
      console.log('[ℹ] Nenhum idContratante fornecido, usando template padrão');
      return ExcelGenerator.TEMPLATE_PATH;
    }

    // Tenta carregar template específico: templates/template_${id}.xlsx
    const templateCustomizado = path.join(__dirname, `../../templates/template_${idContratante}.xlsx`);
    console.log('[DEBUG] Procurando template customizado em:', templateCustomizado);

    if (fs.existsSync(templateCustomizado)) {
      console.log(`[✓] Template encontrado para contratante ${idContratante}:`, templateCustomizado);
      return templateCustomizado;
    }

    console.log(`[ℹ] Template padrão será usado (nenhum template específico encontrado para ${idContratante})`);
    return ExcelGenerator.TEMPLATE_PATH;
  }
  static async aguardar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Formata a data de início para o padrão dd/mm/aaaa
   * @param {string|Date} dataInicio - Data em formato ISO (yyyy-MM-dd), timestamp ou Date
   * @returns {string} Data formatada como dd/mm/aaaa ou 'N/A' se inválida
   */
  static formatarDataInicio(dataInicio) {
    if (!dataInicio) return 'N/A';
    
    let date;
    if (dataInicio instanceof Date) {
      date = dataInicio;
    } else if (typeof dataInicio === 'string') {
      date = new Date(dataInicio);
    } else {
      return 'N/A';
    }

    if (isNaN(date.getTime())) return 'N/A';

    const dia = String(date.getDate() + 1).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();

    return `${dia}/${mes}/${ano}`;
  }
  static async gerarBoletim(dados, caminhoSaida, caminhoTemplateCustom = null, idContratante = null) {
    let workbook = new ExcelJS.Workbook();
    let worksheet;

    // Determina o caminho do template: custom > específico por contratante > padrão
    const caminhoTemplate = caminhoTemplateCustom || ExcelGenerator.obterCaminhoTemplate(idContratante);

    try {
      if (fs.existsSync(caminhoTemplate)) {
        await workbook.xlsx.readFile(caminhoTemplate);
        worksheet = workbook.worksheets[0];
        //await ExcelGenerator.aguardar(ExcelGenerator.DELAY_MS);
        //console.log(`[⏱] Aguardado ${ExcelGenerator.DELAY_MS}ms antes de preencher dados`);
      }
    } catch (error) {
      console.log('Aviso: Erro ao carregar template:', error.message);
    }

    if (!worksheet) {
      worksheet = workbook.addWorksheet('Boletim');
      await this._criarEstruturaPadrao(worksheet);
    }

    await this._preencherDados(worksheet, dados);

    const dirSaida = path.dirname(caminhoSaida);
    try {
      fs.mkdirSync(dirSaida, { recursive: true });
    } catch (e) {
      console.log('Aviso: Erro ao criar diretório:', e.message);
    }

    try {
      await workbook.xlsx.writeFile(caminhoSaida);
      console.log('[✓] Excel gerado com sucesso:', caminhoSaida);
      return caminhoSaida;
    } catch (error) {
      console.error('[✗] Erro ao salvar Excel:', error.message);
      throw new Error('Erro ao gerar arquivo Excel: ' + error.message);
    }
  }

  static async _criarEstruturaPadrao(worksheet) {
    worksheet.columns = [
      { width: 5 },
      { width: 35 },
      { width: 12 },
      { width: 15 },
      { width: 15 }
    ];
  }

  static async _preencherDados(worksheet, dados) {
    if (!dados) return;

    try {
      // Cabeçalho - Informações gerais
      const contratada = (dados.contratada || 'N/A').toUpperCase();
      const cnpj = dados.cnpj || 'N/A';
      const contratante = dados.contratante || 'N/A';
      const objeto = (dados.objeto || 'N/A').toUpperCase();
      const periodo = dados.periodo || 'N/A';
      const nMedicao = dados.nMedicao || 'N/A';
      const numeroProjeto = dados.numeroProjeto || 'N/A';
      const nPedido = dados.nPedido || 'N/A';
      const dataInicio = this.formatarDataInicio(dados.dataInicio);
      const vencimentoNF = dados.vencimentoNF || 'N/A';
      const dataFim = dados.dataFim || 'N/A';

      // Preencher célula E3 com contratada e CNPJ
      const celE3 = worksheet.getCell('E3');
      celE3.value = `${contratada}\nCNPJ: ${cnpj}`;

      // Informações do contratante
      worksheet.getCell('J3').value = contratante;
      worksheet.getCell('D5').value = objeto;
      worksheet.getCell('E7').value = numeroProjeto;
      worksheet.getCell('T3').value = periodo;
      worksheet.getCell('T4').value = nPedido;
      worksheet.getCell('S2').value = nMedicao;
      worksheet.getCell('T5').value = `${vencimentoNF} DD`;
      worksheet.getCell('T6').value = dataInicio;
      worksheet.getCell('T7').value = dataFim;

      // Mês/Ano para abreviação
      if (dados.mesMedicao && dados.anoMedicao) {
        const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        const mesIndex = parseInt(dados.mesMedicao, 10) - 1;
        const mesAbrev = mesIndex >= 0 && mesIndex < 12 ? meses[mesIndex] : 'xxx';
        const anoAbrev = String(dados.anoMedicao).slice(-2);
        worksheet.getCell('U2').value = `${mesAbrev}-${anoAbrev}`;
      }

      // Preencher serviços
      const servicos = dados.servicos || [];
      const startRow = 10;

      if (servicos.length === 0) {
        worksheet.getCell(`B${startRow}`).value = 'Nenhum serviço adicionado';
      } else {
        // Preencher todas as linhas de serviços
        servicos.forEach((servico, index) => {
          const currentRow = startRow + index;
          // Preenchendo as colunas
          worksheet.getCell(`C${currentRow}`).value = index + 1; //ITEM
          worksheet.getCell(`D${currentRow}`).value = servico.descricao;
          worksheet.getCell(`G${currentRow}`).value = { formula: 'E7' }; //CC
          //CONTRATADO
          worksheet.getCell(`H${currentRow}`).value = servico.quantidade; //UN
          worksheet.getCell(`I${currentRow}`).value = servico.precoUnitario;
          worksheet.getCell(`J${currentRow}`).value = { formula: `H${currentRow}*I${currentRow}` };
          //MEDIÇÂO ATUAL
          worksheet.getCell(`K${currentRow}`).value = servico.quantidadeAtual;
          worksheet.getCell(`M${currentRow}`).value = { formula: `IF(K${currentRow}="","",I${currentRow})` }; //PREÇO UNITÁRIO DO SERVIÇO - MEDIÇÃO ATUAL
          worksheet.getCell(`N${currentRow}`).value = { formula: `IF(K${currentRow}="","",M${currentRow}*K${currentRow})` }; //PREÇO TOTAL DO SERVIÇO - MEDIÇÃO ATUAL
          //MEDIÇÃO ACUMULADA
          worksheet.getCell(`O${currentRow}`).value = servico.quantidadeAnterior;
          worksheet.getCell(`P${currentRow}`).value = { formula: `O${currentRow}*I${currentRow}` }; //MEDIÇOES ANTERIORES
          worksheet.getCell(`Q${currentRow}`).value = { formula: `N${currentRow}` }; //VALOR MEDIDO NO MÊS
          worksheet.getCell(`R${currentRow}`).value = { formula: `P${currentRow}+IF(Q${currentRow}="",0,Q${currentRow})` }; //ACUMULADO
          //SALDO
          worksheet.getCell(`S${currentRow}`).value = { formula: `IF(J${currentRow}=0,0,R${currentRow}/J${currentRow})` }; //AVANÇO
          worksheet.getCell(`T${currentRow}`).value = { formula: `H${currentRow}-(K${currentRow}+O${currentRow})` }; //QUANT.
          worksheet.getCell(`U${currentRow}`).value = { formula: `J${currentRow}-R${currentRow}` }; //VALOR
        });
        for (let i = startRow + servicos.length; i < startRow + 26; i++) {
          const linha = worksheet.getRow(i);
          linha.hidden = true;
          linha.commit();
        }
      }
    } catch (error) {
      console.error('Erro ao preencher dados no Excel:', error.message);
    }
  }
}

module.exports = ExcelGenerator;
