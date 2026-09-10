const BoletimService = require('../services/BoletimService');
const ExcelGenerator = require('../services/ExcelGenerator');
const GoogleSheetsService = require('../services/GoogleSheetsService');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

class BoletimController {

  static async criarBoletimExcel(req, res) {
    try {
      console.log('Iniciando geração de Excel com dados:', req.body);
      
      const erros = BoletimService.validarDados(req.body);
      if (erros.length > 0) {
        console.log('Erros de validação:', erros);
        return res.status(400).json({ erro: 'Dados inválidos', detalhes: erros });
      }

      const boletim = BoletimService.criarBoletim(req.body);
      console.log('Boletim criado:', boletim);
      
      // Criar pasta de saída se não existir
      const outputDir = path.join(__dirname, '../../generated');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const nomeArquivo = `boletim_${boletim.id}.xlsx`;
      const caminhoArquivo = path.join(outputDir, nomeArquivo);
      
      console.log('Gerando Excel em:', caminhoArquivo);
      
      // Preparar operações paralelas
      const operacoes = [
        ExcelGenerator.gerarBoletim(boletim, caminhoArquivo, null, req.body.idContratante)
      ];

      // Adicionar operação de salvar em Google Sheets se estiver configurado
      if (GoogleSheetsService.isConfigured()) {
        console.log('[⚡] Google Sheets configurado - salvando dados em paralelo');
        
        // Mapear dados do boletim para o formato esperado pelo GoogleSheetsService
        const dadosGoogleSheets = {
          idMedicao: boletim.id,
          contratada: boletim.empresa,
          cnpj: req.body.cnpj || 'N/A',
          contratante: boletim.contratante,
          idContratante: req.body.idContratante || 'N/A',
          objeto: boletim.nomeObra,
          numeroProjeto: boletim.numeroProjeto,
          nPedido: req.body.nPedido || '',
          mesMedicao: req.body.mesMedicao || '',
          anoMedicao: req.body.anoMedicao || '',
          nMedicao: req.body.nMedicao || '',
          periodo: boletim.periodo,
          dataInicio: req.body.dataInicio || '',
          dataFim: req.body.dataFim || '',
          vencimentoNF: req.body.vencimentoNF || '',
          usuario: req.body.usuario || '',
          servicos: boletim.servicos.map(s => ({
            descricao: s.descricao,
            quantidade: s.quantidade,
            quantidadeAtual: s.quantidadeAtual || 0,
            quantidadeAnterior: s.quantidadeAnterior || 0,
            precoUnitario: s.precoUnitario
          }))
        };

        operacoes.push(
          GoogleSheetsService.salvar(dadosGoogleSheets).catch(err => {
            console.warn('[⚠] Erro ao salvar em Google Sheets:', err.message);
            // Não falhar a requisição se Google Sheets falhar
            return null;
          })
        );
      }

      // Executar todas as operações em paralelo
      console.log('[⚡] Executando operações em paralelo...');
      const resultados = await Promise.all(operacoes);
      console.log('[✓] Excel gerado com sucesso');

      // Enviar o arquivo
      res.download(caminhoArquivo, nomeArquivo, (err) => {
        if (err) {
          console.error('Erro ao fazer download:', err);
        } else {
          console.log('[✓] Download iniciado com sucesso');
        }
      });
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
      res.status(500).json({ erro: 'Erro ao gerar Excel', mensagem: error.message, stack: error.stack });
    }
  }

  static async validarBoletim(req, res) {
    try {
      const erros = BoletimService.validarDados(req.body);
      if (erros.length > 0) {
        return res.status(400).json({ valido: false, erros });
      }
      res.json({ valido: true });
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao validar', mensagem: error.message });
    }
  }

  static async previewBoletim(req, res) {
    try {
      const erros = BoletimService.validarDados(req.body);
      if (erros.length > 0) {
        return res.status(400).json({ erro: 'Dados inválidos', detalhes: erros });
      }

      const boletim = BoletimService.criarBoletim(req.body);
      res.json(boletim);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao visualizar', mensagem: error.message });
    }
  }
}

module.exports = BoletimController;
