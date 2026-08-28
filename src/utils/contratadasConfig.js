const fs = require('fs');
const path = require('path');

class ContratadasConfig {
  static caminhoConfig = path.join(__dirname, '../config/contratadas.json');

  static carregar() {
    try {
      const conteudo = fs.readFileSync(this.caminhoConfig, 'utf8');
      return JSON.parse(conteudo).contratadas || [];
    } catch (error) {
      console.error('Erro ao carregar contratadas:', error.message);
      return [];
    }
  }

  static salvar(contratadas) {
    try {
      fs.writeFileSync(this.caminhoConfig, JSON.stringify({ contratadas }, null, 2), 'utf8');
      console.log('[✓] Contratadas salvas com sucesso');
      return true;
    } catch (error) {
      console.error('[✗] Erro ao salvar contratadas:', error.message);
      return false;
    }
  }
  
  static obterTodos() {
    return this.carregar();
  }

  /**
   * Adiciona ou atualiza uma contratada no cadastro
   * @param {string} nome - Nome da contratada
   * @param {string} cnpj - CNPJ da contratada
   * @returns {boolean} true se foi adicionada/atualizada, false caso contrário
   */
  static adicionarOuAtualizar(nome, cnpj) {
    if (!nome || !cnpj) {
      console.log('[ℹ] Nome e CNPJ são obrigatórios');
      return false;
    }

    const contratadas = this.carregar();
    
    // Verificar se já existe (por CNPJ)
    const existe = contratadas.find(c => 
      c.cnpj.replace(/\D/g, '') === cnpj.replace(/\D/g, '')
    );

    if (existe) {
      console.log(`[ℹ] Contratada ${nome} (${cnpj}) já existe no cadastro`);
      return false;
    }

    // Adicionar nova contratada
    contratadas.push({
      id: `CONTRATADA_${Date.now()}`,
      nome: nome.toUpperCase(),
      cnpj: cnpj,
      dataCadastro: new Date().toISOString()
    });

    this.salvar(contratadas);
    console.log(`[✓] Contratada adicionada: ${nome} (${cnpj})`);
    return true;
  }

  /**
   * Obtém todas as contratadas cadastradas
   * @returns {Array} Lista de contratadas
   */
  static obterTodas() {
    return this.carregar();
  }

  /**
   * Busca contratada por CNPJ
   * @param {string} cnpj - CNPJ a buscar
   * @returns {Object|null} Contratada encontrada ou null
   */
  static obterPorCnpj(cnpj) {
    const todos = this.carregar();
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    return todos.find(c => c.cnpj.replace(/\D/g, '') === cnpjLimpo) || null;
  }

  /**
   * Busca contratada por nome (parcial)
   * @param {string} nome - Nome (ou parte dele) a buscar
   * @returns {Array} Lista de contratadas encontradas
   */
  static obterPorNome(nome) {
    const todos = this.carregar();
    const nomeBusca = nome.toUpperCase();
    return todos.filter(c => c.nome.includes(nomeBusca));
  }
}

module.exports = ContratadasConfig;
