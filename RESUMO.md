# ⚖️ Monique Advogados - Resumo do Sistema

## ✅ Status: Sistema Completo e Funcional

---

## 🎯 O que foi implementado

### 1. **Sistema de Gestão Jurídica**
- Backend: Node.js + Express + Prisma + SQLite
- Frontend: React + Vite + Tailwind CSS
- Banco de dados SQLite (portátil, sem servidor)

### 2. **Controle de Acesso por Cargos (20 Usuários)**

| Cargo | Email | Permissões |
|-------|-------|------------|
| 👑 SUPER_ADMIN | monique@moniqueadvogados.com | Tudo (ver todos os dados) |
| 👑 SOCIO | ricardo@moniqueadvogados.com | Acesso total da equipe |
| ⚖️ ADVOGADO | ana.silva@moniqueadvogados.com | Apenas seus casos |
| 👩‍💼 ASSISTENTE | camila@moniqueadvogados.com | Casos do advogado |
| 💰 FINANCEIRO | roberto@moniqueadvogados.com | Financeiro + Relatórios |

**Senha para todos:** `senha123`

### 3. **Filtragem Automática de Dados**
- SUPER_ADMIN vê TUDO (3 casos, 3 clientes, etc.)
- ADVOGADO vê APENAS seus casos (1 caso)
- FINANCEIRO vê financeiro + relatórios

### 4. **Funcionalidades**
- ✅ Gestão de clientes
- ✅ Controle de processos
- ✅ Agenda integrada
- ✅ Prazos processuais
- ✅ Gestão de documentos
- ✅ Controle de honorários
- ✅ Notificações em tempo real
- ✅ Dashboard com relatórios

### 5. **Branding**
- Nome: "⚖️ Monique Advogados"
- Cor: Azul escuro (#1a365d) + Dourado (#d4af37)
- Símbolo: ⚖️ (balança da justiça)

---

## 🚀 Como Usar

### Iniciar o Sistema
```bash
# Execute como administrador
run.bat
```

### Acessar
- URL: http://localhost:3000
- Login: monique@moniqueadvogados.com
- Senha: senha123

### Parar o Sistema
```bash
stop.bat
```

---

## 📁 Estrutura

```
crm-juridico-sqlite/
├── backend/           # API (porta 3001)
│   ├── prisma/        # Schema + dados
│   └── src/           # Código fonte
├── frontend/          # Interface (porta 3000)
├── installer/         # Scripts de instalação
├── run.bat           # Iniciar
├── stop.bat          # Parar
└── install.bat       # Instalar
```

---

## 🔧 Comandos Úteis

```bash
# Backend
cd backend
npm run dev          # Iniciar backend
npx prisma studio    # Ver banco de dados
npx prisma db seed   # Popular dados

# Frontend
cd frontend
npm run dev          # Iniciar frontend
```

---

## 📋 Backup

O banco SQLite está em: `backend/prisma/dev.db`

Para backup, basta copiar este arquivo!

---

## ✅ Testes Realizados

| Teste | Resultado |
|-------|-----------|
| Login SUPER_ADMIN | ✅ OK |
| Login ADVOGADO | ✅ OK |
| Permissões SUPER_ADMIN | ✅ Todas true |
| Permissões ADVOGADO | ✅ Filtrado |
| Casos SUPER_ADMIN | ✅ 3 casos |
| Casos ADVOGADO | ✅ 1 caso |
| Backend health | ✅ 200 OK |
| Frontend | ✅ 200 OK |

---

**⚖️ Monique Advogados** - Sistema de Gestão Jurídica v1.0.0
