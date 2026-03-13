```markdown
# Sistema Integrado de Monitoramento de Cargas (WIM)

> **Projeto Integrador - Equipe 3 | UNIJUÍ**
> Protótipo de software para monitoramento de rodovias, integrando pesagem em movimento (Weigh-In-Motion) com inteligência de conformidade fiscal e telemetria viária.

---

## 🛠️ Tecnologias Utilizadas
* **Backend:** Python 3, FastAPI, Uvicorn (REST API)
* **Frontend:** Node.js, React.js, Axios
* **Ambiente:** Testado e homologado para Windows

---

## ⚙️ Pré-requisitos e Instalação

Antes de clonar o repositório, certifique-se de ter as seguintes ferramentas instaladas em sua máquina:

1. **[Python](https://www.python.org/downloads/)** (Motor do Backend)
   * **ATENÇÃO CRÍTICA:** Durante a instalação no Windows, é obrigatório marcar a caixa **"Add python.exe to PATH"** na tela inicial.
2. **[Node.js](https://nodejs.org/)** (Motor do Frontend)
   * Recomenda-se a versão **LTS**. A instalação padrão atende aos requisitos.
3. **[Visual Studio Code](https://code.visualstudio.com/)** (IDE Recomendada)

### Liberação de Segurança (Windows)
O Windows pode bloquear a execução de scripts necessários para o Node.js. Para habilitar o ambiente de desenvolvimento, abra um terminal PowerShell como Administrador (ou integrado no VS Code) e execute:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

```

*Pressione `A` (Sim para Todos) se o sistema solicitar confirmação.*

---

## 🚀 Configuração do Ambiente

Após clonar o repositório, abra a pasta principal do projeto no VS Code e configure as bibliotecas necessárias.

### 1. Dependências do Backend (API)

No terminal integrado do VS Code, certifique-se de estar na pasta raiz do projeto e instale as bibliotecas do Python:

```powershell
python -m pip install fastapi uvicorn pydantic

```

### 2. Dependências do Frontend (Painel React)

Ainda no terminal, acesse a pasta do painel visual e instale os pacotes do Node.js:

```powershell
cd painel-rodovia
npm install

```

---

## 💻 Executando a Aplicação dentro do VS Code

A arquitetura exige que o Backend (motor de regras) e o Frontend (interface visual) operem de forma simultânea. Para isso, utilize **dois terminais separados** no próprio VS Code.

**Terminal 1: Inicializando o Servidor Python**
Abra um terminal na pasta raiz do projeto e execute:

```powershell
python -m uvicorn main:app --reload

```

*Aguarde a mensagem indicando que a API está rodando (geralmente em `http://localhost:8000`). Deixe este terminal aberto e processando.*

**Terminal 2: Inicializando o Dashboard React**
Abra uma **nova aba de terminal** (Terminal > New Terminal) no VS Code, navegue até a pasta do painel e inicie a aplicação:

```powershell
cd painel-rodovia
npm start

```

*O navegador padrão será aberto automaticamente no endereço `http://localhost:3000` com a interface operacional pronta para uso.*


```
