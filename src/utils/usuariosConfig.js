const fs = require('fs');
const path = require('path');

class UsuariosConfig {
  static usuarios = null;

  static carregar() {
    if (!this.usuarios) {
      try {
        const caminhoConfig = path.join(__dirname, '../config/usuarios.json');
        const conteudo = fs.readFileSync(caminhoConfig, 'utf8');
        this.usuarios = JSON.parse(conteudo).usuarios || [];
      } catch (error) {
        console.error('Erro ao carregar usuários:', error.message);
        this.usuarios = [];
      }
    }
    return this.usuarios;
  }

  static obterTodos() {
    return this.carregar();
  }
}

module.exports = UsuariosConfig;
