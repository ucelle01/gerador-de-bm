## 📚 Exemplos de Requisições API

### Endpoint: POST /api/boletim/validar
Valida os dados do boletim sem gerar arquivo

**Request:**
```bash
curl -X POST http://localhost:3000/api/boletim/validar \
  -H "Content-Type: application/json" \
  -d '{
    "empresa": "Empresa ABC",
    "periodo": "Janeiro/2026",
    "responsavel": "João Silva",
    "observacoes": "Serviços prestados conforme contrato",
    "servicos": [
      {
        "descricao": "Limpeza de pátio",
        "quantidade": 8,
        "unidade": "Horas",
        "precoUnitario": 50.00
      },
      {
        "descricao": "Conserto de vidro",
        "quantidade": 1,
        "unidade": "Unidade",
        "precoUnitario": 200.00
      }
    ]
  }'
```

**Response (Sucesso):**
```json
{
  "valido": true
}
```

**Response (Erro):**
```json
{
  "valido": false,
  "erros": [
    "Empresa é obrigatória",
    "Período é obrigatório"
  ]
}
```

---

### Endpoint: POST /api/boletim/preview
Retorna o boletim processado para visualização

**Request:**
```bash
curl -X POST http://localhost:3000/api/boletim/preview \
  -H "Content-Type: application/json" \
  -d '{
    "empresa": "XYZ Construtora",
    "periodo": "Fevereiro/2026",
    "responsavel": "Maria Santos",
    "servicos": [
      {
        "descricao": "Pintura de parede",
        "quantidade": 100,
        "unidade": "Metros quadrados",
        "precoUnitario": 25.00
      }
    ]
  }'
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "empresa": "XYZ Construtora",
  "periodo": "Fevereiro/2026",
  "responsavel": "Maria Santos",
  "servicos": [
    {
      "descricao": "Pintura de parede",
      "quantidade": 100,
      "unidade": "Metros quadrados",
      "precoUnitario": 25
    }
  ],
  "observacoes": "",
  "dataCriacao": "2026-01-22T10:30:00.000Z",
  "total": 2500
}
```

---

### Endpoint: POST /api/boletim/pdf
Gera e retorna um PDF do boletim

**Request:**
```bash
curl -X POST http://localhost:3000/api/boletim/pdf \
  -H "Content-Type: application/json" \
  -d '{
    "empresa": "TechServices Ltda",
    "periodo": "Março/2026",
    "responsavel": "Carlos Oliveira",
    "observacoes": "Conforme contrato 123/2025",
    "servicos": [
      {
        "descricao": "Suporte técnico",
        "quantidade": 20,
        "unidade": "Horas",
        "precoUnitario": 75.00
      },
      {
        "descricao": "Instalação de software",
        "quantidade": 2,
        "unidade": "Unidades",
        "precoUnitario": 300.00
      }
    ]
  }' > boletim.pdf
```

**Response:** Arquivo PDF é enviado

---

### Endpoint: POST /api/boletim/excel
Gera e retorna um Excel do boletim

**Request:**
```bash
curl -X POST http://localhost:3000/api/boletim/excel \
  -H "Content-Type: application/json" \
  -d '{
    "empresa": "Limpeza Express",
    "periodo": "Abril/2026",
    "responsavel": "Ana Costa",
    "servicos": [
      {
        "descricao": "Limpeza geral",
        "quantidade": 12,
        "unidade": "Dias",
        "precoUnitario": 100.00
      },
      {
        "descricao": "Reposição de higiene",
        "quantidade": 2,
        "unidade": "Unidades",
        "precoUnitario": 50.00
      }
    ]
  }' > boletim.xlsx
```

**Response:** Arquivo Excel é enviado

---

## 🔄 Fluxo Completo Exemplo

1. **Validar dados:**
```bash
curl -X POST http://localhost:3000/api/boletim/validar -H "Content-Type: application/json" -d '{...}'
```

2. **Ver preview:**
```bash
curl -X POST http://localhost:3000/api/boletim/preview -H "Content-Type: application/json" -d '{...}'
```

3. **Gerar PDF:**
```bash
curl -X POST http://localhost:3000/api/boletim/pdf -H "Content-Type: application/json" -d '{...}' > resultado.pdf
```

---

## 📊 Estrutura Esperada dos Dados

```javascript
{
  // Informações básicas (obrigatório: empresa e periodo)
  "empresa": "string",          // Obrigatório
  "periodo": "string",          // Obrigatório
  "responsavel": "string",      // Opcional
  "observacoes": "string",      // Opcional
  
  // Serviços (obrigatório: pelo menos um)
  "servicos": [
    {
      "descricao": "string",      // Obrigatório
      "quantidade": "number",     // Obrigatório (> 0)
      "unidade": "string",        // Obrigatório
      "precoUnitario": "number"   // Obrigatório (>= 0)
    }
  ]
}
```

---

## ⚠️ Códigos de Erro

| Status | Erro | Solução |
|--------|------|---------|
| 400 | Dados inválidos | Verifique os campos obrigatórios |
| 500 | Erro ao gerar PDF | Verifique se a pasta 'generated' foi criada |
| 500 | Erro ao gerar Excel | Verifique as permissões de escrita |

---

## 🧪 Testar com Insomnia/Postman

1. Crie uma nova request POST
2. URL: `http://localhost:3000/api/boletim/pdf`
3. Selecione "Body" → "raw" → "JSON"
4. Cole o JSON do boletim
5. Clique em "Send"
6. O arquivo PDF será baixado automaticamente

---

**Dica:** Use as requisições acima como base para integrar com suas aplicações!
