const fs = require('fs');
const path = require('path');

class ContratantesConfig {
  static contratantes = null;

  static carregar() {
    if (!this.contratantes) {
      try {
        const caminhoConfig = path.join(__dirname, '../config/contratantes.json');
        const conteudo = fs.readFileSync(caminhoConfig, 'utf8');
        this.contratantes = JSON.parse(conteudo).contratantes;
      } catch (error) {
        console.error('Erro ao carregar contratantes:', error.message);
        this.contratantes = [];
      }
    }
    return this.contratantes;
  }

  static obterPorId(id) {
    const todos = this.carregar();
    return todos.find(c => c.id === id);
  }

  static obterPorNome(nome) {
    const todos = this.carregar();
    return todos.find(c => c.nome === nome || c.sigla === nome);
  }

  static obterTodos() {
    return this.carregar();
  }

  static obterLogo(identificador) {
    const contratante = this.obterPorId(identificador) || this.obterPorNome(identificador);
    return contratante?.logo || null;
  }
}

module.exports = ContratantesConfig;