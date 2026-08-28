const { v4: uuidv4 } = require('uuid');
const ContratadosConfig = require('../utils/contratadasConfig');

class BoletimService {
  static validarDados(dados) {
    const erros = [];

    if (!dados.empresa || dados.empresa.trim() === '') { 
      erros.push('Empresa é obrigatória');
    }

    if (!dados.contratante || dados.contratante.trim() === '') {
      erros.push('Contratante é obrigatório');
    }

    if (!dados.nomeObra || dados.nomeObra.trim() === '') {
      erros.push('Nome da Obra é obrigatório');
    }

    if (!dados.numeroProjeto || dados.numeroProjeto.trim() === '') {
      erros.push('Número do Projeto é obrigatório');
    }

    if (!dados.periodo || dados.periodo.trim() === '') {
      erros.push('Período é obrigatório');
    }

    if (!dados.servicos || !Array.isArray(dados.servicos) || dados.servicos.length === 0) {
      erros.push('Pelo menos um serviço deve ser informado');
    } else {
      dados.servicos.forEach((servico, index) => {
        if (!servico.descricao) erros.push(`Serviço ${index + 1}: descrição é obrigatória`);
        if (!servico.quantidade || servico.quantidade <= 0) erros.push(`Serviço ${index + 1}: quantidade inválida`);
        if (!servico.unidade) erros.push(`Serviço ${index + 1}: unidade é obrigatória`);
        if (!servico.precoUnitario || servico.precoUnitario <= 0) erros.push(`Serviço ${index + 1}: preço unitário inválido`);
      });
    }

    return erros;
  }

  static criarBoletim(dados) { 
    // Salvar a contratada no cadastro
    if (dados.empresa && dados.cnpj) {
      ContratadosConfig.adicionarOuAtualizar(dados.empresa, dados.cnpj);
    }

    return {
      id: uuidv4(),// Gerar ID único para o boletim
      empresa: dados.empresa,
      contratante: dados.contratante,
      idContratante: dados.idContratante || '', // Armazenar ID da contratante
      nomeObra: dados.nomeObra,
      numeroProjeto: dados.numeroProjeto,
      periodo: dados.periodo,
      responsavel: dados.responsavel || '',
      servicos: dados.servicos || [],
      observacoes: dados.observacoes || '',
      dataCriacao: new Date(),
      total: (dados.servicos || []).reduce((sum, s) => sum + (s.quantidade * s.precoUnitario), 0)
    };
  }
}

module.exports = BoletimService;
