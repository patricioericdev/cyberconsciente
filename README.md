# 🧠 Cyberconsciente

> Detecte se um conteúdo foi gerado por **Inteligência Artificial** ou por um **Humano**.

![Cyberconsciente](https://img.shields.io/badge/status-online-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Funcionalidades

- 📝 **Detecção de Texto** — analisa padrões linguísticos, conectivos, uniformidade e estrutura
- 🖼️ **Detecção de Imagem** — analisa correlação de cores, ruído, simetria e bordas
- 🎨 **Interface cyberpunk** dark com animações
- ⚡ **API REST** documentada (FastAPI + Swagger)

---

## 🚀 Rodando Localmente

### Pré-requisitos
- Python 3.10+
- Node.js 18+

### 1. Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Acesse: **http://localhost:5173**

> Ou simplesmente dê duplo clique em `iniciar.bat` no Windows!

---

## 🌐 Deploy

### Backend → Render

1. Crie conta em [render.com](https://render.com)
2. New → Web Service → conecte este repositório
3. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Copie a URL gerada (ex: `https://cyberconsciente-api.onrender.com`)

### Frontend → Vercel

1. Crie conta em [vercel.com](https://vercel.com)
2. New Project → importe este repositório
3. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
4. Adicione a variável de ambiente:
   - `VITE_API_URL` = URL do Render (ex: `https://cyberconsciente-api.onrender.com`)
5. Deploy!

---

## 🗂️ Estrutura

```
cyberconsciente/
├── backend/
│   ├── main.py              # API FastAPI
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   └── components/
│   │       ├── TextDetector.tsx
│   │       ├── ImageDetector.tsx
│   │       └── ResultCard.tsx
│   ├── vercel.json
│   └── package.json
└── iniciar.bat              # Atalho Windows
```

---

## 🛠️ Tech Stack

| Camada | Tech |
|--------|------|
| Frontend | React + Vite + TypeScript + TailwindCSS |
| Backend | Python + FastAPI + Uvicorn |
| Detecção | Heurísticas multi-fator (sem dependência pesada) |
| Deploy | Vercel (frontend) + Render (backend) |

---

## 📄 Licença

MIT © Cyberconsciente 2026
