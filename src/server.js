const express = require('express');
const path = require('path');
const app = express();

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, '../public')));

// Middleware de debug para servir imagens da pasta logos
app.use('/logos', express.static(path.join(__dirname, '../public/logos'), {
  setHeaders: (res, path) => {
    console.log('[FILE] Servindo arquivo:', path);
  }
}));

console.log('[INFO] Pasta de logos:', path.join(__dirname, '../public/logos'));
console.log('[INFO] Middleware de arquivos estáticos configurado');

// ...existing code...