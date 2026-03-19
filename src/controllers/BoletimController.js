const BoletimService = require('../services/BoletimService');
const ExcelGenerator = require('../services/ExcelGenerator');
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
      const outputDir = path.join(__dirname, '../../generated'); // Usar caminho absoluto para pasta de saída
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const nomeArquivo = `boletim_${boletim.id}.xlsx`; // Usar ID do boletim para nome do arquivo
      const caminhoArquivo = path.join(outputDir, nomeArquivo); // Gerar caminho completo do arquivo
      
      console.log('Gerando Excel em:', caminhoArquivo);
      // Passar o ID da contratante para selecionar o template apropriado
      await ExcelGenerator.gerarBoletim(boletim, caminhoArquivo, null, req.body.idContratante);
      console.log('Excel gerado com sucesso');

      res.download(caminhoArquivo, nomeArquivo, (err) => {
        if (err) console.error('Erro ao fazer download:', err);
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
