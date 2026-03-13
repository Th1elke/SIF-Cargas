# Sistema Integrado de Monitoramento de Cargas (WIM)


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

---

## 🚀 Configuração do Ambiente

Após clonar o repositório, abra a pasta principal do projeto no VS Code e configure as bibliotecas necessárias.

### 1. Dependências do Backend (API)
No terminal integrado do VS Code, certifique-se de estar na pasta raiz do projeto e instale as bibliotecas do Python:
```powershell
python -m pip install fastapi uvicorn pydantic
