# Gerador de Boletim de Medição de Serviços

Um aplicativo Node.js completo para gerar boletins de medição de serviços com exportação em PDF e Excel.

## 🚀 Características

- ✅ Interface web moderna e intuitiva
- 📄 Geração de PDF profissional
- 📊 Exportação para Excel
- 🔍 Visualização prévia dos dados
- ✔️ Validação de dados em tempo real
- 📱 Design responsivo
- 💾 Cálculo automático de totais

## 📋 Requisitos

- Node.js 14+ 
- npm ou yarn

## 🔧 Instalação

1. Clone ou extraia o projeto:
```bash
cd "Gerador de BM"
```

2. Instale as dependências:
```bash
npm install
```

## ▶️ Como Executar

### Modo desenvolvimento:
```bash
npm run dev
```

### Modo produção:
```bash
npm start
```

O servidor será iniciado em `http://localhost:3000`

## 📖 Como Usar

1. Abra o navegador e acesse `http://localhost:3000`
2. Preencha os dados da empresa:
   - Nome da empresa (obrigatório)
   - Período de medição (obrigatório)
   - Responsável pela medição (opcional)
   - Observações adicionais (opcional)

3. Adicione os serviços medidos:
   - Descrição do serviço
   - Quantidade
   - Unidade de medida
   - Preço unitário

4. Clique em um dos botões:
   - 👁️ **Visualizar** - Vê um preview do boletim
   - 📄 **Gerar PDF** - Baixa o boletim em PDF
   - 📊 **Gerar Excel** - Baixa o boletim em Excel

## 🏗️ Estrutura do Projeto

```
Gerador de BM/
├── src/
│   ├── index.js                 # Arquivo principal
│   ├── controllers/
│   │   └── BoletimController.js # Lógica de negócio
│   ├── routes/
│   │   └── boletimRoutes.js     # Definição de rotas
│   ├── services/
│   │   ├── BoletimService.js    # Serviço de boletim
│   │   ├── PDFGenerator.js      # Gerador de PDF
│   │   └── ExcelGenerator.js    # Gerador de Excel
│   └── utils/                   # Utilitários
├── public/
│   ├── index.html               # Interface web
│   ├── styles.css               # Estilos
│   └── script.js                # Lógica do cliente
├── package.json                 # Dependências
└── README.md                    # Este arquivo
```

## 🔌 API Endpoints

### POST /api/boletim/pdf
Gera um PDF do boletim
- **Body**: Dados do boletim em JSON
- **Response**: Arquivo PDF para download

### POST /api/boletim/excel
Gera um Excel do boletim
- **Body**: Dados do boletim em JSON
- **Response**: Arquivo Excel para download

### POST /api/boletim/preview
Visualiza os dados do boletim
- **Body**: Dados do boletim em JSON
- **Response**: Dados do boletim processado

### POST /api/boletim/validar
Valida os dados do boletim
- **Body**: Dados do boletim em JSON
- **Response**: Status de validação

## 📝 Exemplo de Dados

```json
{
  "empresa": "Empresa XYZ",
  "periodo": "Janeiro/2026",
  "responsavel": "João Silva",
  "observacoes": "Serviços realizados conforme contrato",
  "servicos": [
    {
      "descricao": "Limpeza de área comum",
      "quantidade": 10,
      "unidade": "Horas",
      "precoUnitario": 50.00
    },
    {
      "descricao": "Conserto de vidraça",
      "quantidade": 2,
      "unidade": "Unidade",
      "precoUnitario": 150.00
    }
  ]
}
```

## 🛠️ Dependências Principais

- **express** - Framework web
- **pdfkit** - Geração de PDF
- **exceljs** - Geração de Excel
- **uuid** - Geração de IDs únicos
- **cors** - Suporte a CORS
- **body-parser** - Parsing de JSON

## 🎨 Personalização

### Alterar cores do tema
Edite `public/styles.css` e procure pela paleta de cores (ex: `#667eea`).

### Ajustar formato do PDF
Modifique `src/services/PDFGenerator.js` para personalizar estilos, fontes e layout.

### Customizar Excel
Edite `src/services/ExcelGenerator.js` para mudar formatação, cores e estrutura.

## 🐛 Troubleshooting

**Erro: "Cannot find module"**
```bash
npm install
```

**Porta 3000 já está em uso**
```bash
set PORT=3001
npm start
```

**Arquivos gerados não aparecem**
Verifique se a pasta `generated/` foi criada automaticamente.

## 📄 Licença

MIT

## 👨‍💻 Autor

Desenvolvido para automatizar a geração de boletins de medição de serviços.

---

**Versão**: 1.0.0  
**Última atualização**: Janeiro/2026

## Testes

### Executar todos os testes:
```bash
npm test
```

### Executar testes com watch:
```bash
npm run test:watch
```

### Executar testes com coverage:
```bash
npm run test:coverage
```

### Tipos de teste incluídos:
- **Unitários**: Testes da classe ExcelGenerator
- **Integração**: Testes das rotas da API
- **Frontend**: Testes básicos da interface (usando jsdom)
