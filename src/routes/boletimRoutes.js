const express = require('express');
const ExcelGenerator = require('../services/ExcelGenerator');
const path = require('path');
const fs = require('fs');
const ContratantesConfig = require('../utils/contratantesConfig');
const ContratadasConfig = require('../utils/contratadasConfig');
const UsuariosConfig = require('../utils/usuariosConfig');
const GoogleSheetsService = require('../services/GoogleSheetsService');

const router = express.Router();

// Validação centralizada
function validarDadosBoletim(dados) {
  const erros = [];

  if (!dados.contratada?.trim()) erros.push('Contratada é obrigatória');
  if (!dados.usuario?.trim()) erros.push('Usuário é obrigatório');
  if (!dados.cnpj?.trim()) erros.push('CNPJ é obrigatório');
  if (!dados.contratante?.trim()) erros.push('Contratante é obrigatório');
  if (!dados.objeto?.trim()) erros.push('Objeto é obrigatório');
  if (!dados.numeroProjeto?.trim()) erros.push('Número do Projeto é obrigatório');
  if (!dados.periodo?.trim()) erros.push('Período é obrigatório');
  if (!dados.dataInicio?.trim()) erros.push('Data de Início é obrigatória');
  if (!dados.nMedicao?.toString().trim()) erros.push('Número da Medição é obrigatório');
  if (!dados.vencimentoNF?.trim()) erros.push('Vencimento da NF é obrigatório');

  if (!dados.servicos || !Array.isArray(dados.servicos) || dados.servicos.length === 0) {
    erros.push('Adicione pelo menos um serviço');
  } else {
    dados.servicos.forEach((servico, index) => {
      if (!servico.descricao?.trim()) erros.push(`Serviço ${index + 1}: descrição é obrigatória`);
      if (!servico.quantidade || servico.quantidade <= 0) erros.push(`Serviço ${index + 1}: quantidade inválida`);
      if (!servico.precoUnitario && servico.precoUnitario !== 0) erros.push(`Serviço ${index + 1}: preço inválido`);
    });
  }

  return erros;
}

// Preview
router.post('/preview', (req, res) => {
  try {
    const dados = req.body;
    const erros = validarDadosBoletim(dados);

    if (erros.length > 0) {
      return res.status(400).json({ error: 'Dados inválidos', detalhes: erros });
    }

    // Processar dados para preview
    const preview = {
      ...dados,
      total: (dados.servicos || []).reduce((sum, s) => sum + (s.quantidade * s.precoUnitario), 0)
    };

    res.json(preview);
  } catch (error) {
    console.error('Erro no preview:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Gerar Excel
router.post('/excel', async (req, res) => {
  let caminhoArquivo = null;

  try {
    const dados = req.body;
    const erros = validarDadosBoletim(dados);

    if (erros.length > 0) {
      return res.status(400).json({ error: 'Dados inválidos', detalhes: erros });
    }

    const registro = await GoogleSheetsService.salvar(dados);
    if (registro) {
      dados.idMedicao = registro.idMedicao;
      dados.servicos = registro.servicos;
      res.setHeader('X-Medicao-ID', registro.idMedicao);
    }

    // Se não tiver logo, buscar do contratante
    if (!dados.logoUrl) {
      const contratantes = ContratantesConfig.obterTodos();
      const contratante = contratantes.find(c =>
        c.id === dados.contratante || c.nome === dados.contratante
      );
      if (contratante) {
        dados.logoUrl = contratante.logo;
      }
    }

    // Gerar nome único
    const timestamp = Date.now();
    const nomeArquivo = `boletim_${timestamp}.xlsx`;
    caminhoArquivo = path.join(__dirname, '../../temp', nomeArquivo);

    // Criar diretório temp
    const dirTemp = path.dirname(caminhoArquivo);
    if (!fs.existsSync(dirTemp)) {
      fs.mkdirSync(dirTemp, { recursive: true });
    }

    console.log('[INFO] Gerando Excel:', caminhoArquivo);
    console.log('[DEBUG] idContratante recebido:', dados.idContratante);
    await ExcelGenerator.gerarBoletim(dados, caminhoArquivo, null, dados.idContratante);

    // Enviar arquivo
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);

    const fileStream = fs.createReadStream(caminhoArquivo);
    
    fileStream.on('error', (err) => {
      console.error('[✗] Erro ao ler arquivo:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Erro ao ler arquivo' });
      }
    });

    fileStream.pipe(res);

    // Limpar após envio
    fileStream.on('end', () => {
      setTimeout(() => {
        try {
          if (caminhoArquivo && fs.existsSync(caminhoArquivo)) {
            fs.unlinkSync(caminhoArquivo);
            console.log('[INFO] Arquivo temporário removido');
          }
        } catch (err) {
          console.error('[⚠] Erro ao remover arquivo temporário:', err.message);
        }
      }, 1000);
    });

  } catch (error) {
    console.error('[✗] Erro ao gerar Excel:', error);
    
    // Cleanup em caso de erro
    try {
      if (caminhoArquivo && fs.existsSync(caminhoArquivo)) {
        fs.unlinkSync(caminhoArquivo);
      }
    } catch (e) {
      console.error('[⚠] Erro ao limpar arquivo de erro:', e.message);
    }

    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        detalhes: error.message 
      });
    }
  }
});

// Contratantes
router.get('/contratantes', (req, res) => {
  try {
    const contratantes = ContratantesConfig.obterTodos();
    res.json(contratantes);
  } catch (error) {
    console.error('Erro ao obter contratantes:', error);
    res.status(500).json({ error: 'Erro ao obter lista de contratantes' });
  }
});

// Contratadas
router.get('/contratadas', async (req, res) => {
  try {
    const contratadas = await GoogleSheetsService.listarContratadas();
    res.json(contratadas);
  } catch (error) {
    console.error('Erro ao obter contratadas:', error);
    res.status(500).json({ error: 'Erro ao obter lista de contratadas' });
  }
});

router.get('/usuarios', (req, res) => {
  try {
    res.json(UsuariosConfig.obterTodos());
  } catch (error) {
    console.error('Erro ao obter lista de usuários:', error);
    res.status(500).json({ error: 'Erro ao obter lista de usuários' });
  }
});

router.post('/contratadas', async (req, res) => {
  try {
    const { nome, cnpj } = req.body;

    if (!nome?.trim() || !cnpj?.trim()) {
      return res.status(400).json({ error: 'Nome e CNPJ são obrigatórios' });
    }

    const nomeNormalizado = nome.trim();
    const cnpjNormalizado = cnpj.trim();
    const adicionada = GoogleSheetsService.isConfigured()
      ? await GoogleSheetsService.adicionarContratada(nomeNormalizado, cnpjNormalizado)
      : ContratadasConfig.adicionarOuAtualizar(nomeNormalizado, cnpjNormalizado);

    if (adicionada === false) {
      return res.status(409).json({ error: 'CNPJ já cadastrado ou dados inválidos' });
    }

    const contratada = adicionada || ContratadasConfig.obterPorCnpj(cnpjNormalizado);
    res.status(201).json(contratada);
  } catch (error) {
    console.error('Erro ao salvar contratada:', error);
    res.status(500).json({ error: 'Erro ao salvar contratada' });
  }
});

router.get('/medicoes', async (req, res) => {
  try {
    res.json(await GoogleSheetsService.listar());
  } catch (error) {
    console.error('Erro ao consultar medições:', error);
    res.status(500).json({ error: 'Erro ao consultar medições' });
  }
});

router.get('/medicoes/:id', async (req, res) => {
  try {
    const medicao = await GoogleSheetsService.buscar(req.params.id);
    if (!medicao) return res.status(404).json({ error: 'Medição não encontrada' });
    res.json(medicao);
  } catch (error) {
    console.error('Erro ao consultar medição:', error);
    res.status(500).json({ error: 'Erro ao consultar medição' });
  }
});


module.exports = router;
