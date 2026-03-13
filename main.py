from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Sistema de Monitoramento de Cargas - Equipe 3")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MOCK_DATABASE = {
    "ABC1234": {
        "chassi": "9BWZZZ37Z...",
        "fabricante": "Volvo",
        "modelo": "FH 540",
        "ano": 2022,
        "eixos_registrados": 6,
        "status_roubo": False,
        "mdfe_ativo": True,
        "carga_declarada": "Eletrônicos",
        "peso_declarado_kg": 15000,
        "nfe_numero": "35230112345678000199550010009876541000123458",
        "valor_carga": 250000.00,
        "origem": "São Paulo, SP",
        "destino": "Porto Alegre, RS",
        "empresa_cnpj": "12.345.678/0001-99"
    },
    "XYZ9876": {
        "chassi": "9BWYYY44X...",
        "fabricante": "Scania",
        "modelo": "R 450",
        "ano": 2021,
        "eixos_registrados": 4,
        "status_roubo": False,
        "mdfe_ativo": True,
        "carga_declarada": "Soja",
        "peso_declarado_kg": 30000,
        "nfe_numero": "43230198765432000111550010001234561000987654",
        "valor_carga": 85000.00,
        "origem": "Passo Fundo, RS",
        "destino": "Rio Grande, RS",
        "empresa_cnpj": "98.765.432/0001-11"
    }
}

LIMITE_TOLERANCIA_PESO = 1000

class SensorData(BaseModel):
    placa: str
    peso_medido_kg: float
    eixos_lidos: int

@app.post("/api/analisar_veiculo")
def analisar_veiculo(data: SensorData):
    veiculo = MOCK_DATABASE.get(data.placa.upper())

    if not veiculo:
        return {"status": "ERRO", "mensagem": "Veículo não encontrado ou possível clonagem."}

    peso_declarado = veiculo["peso_declarado_kg"]
    diferenca_peso = data.peso_medido_kg - peso_declarado

    alerta_transito = False
    alerta_fiscal = False
    bloqueio_cnpj = False

    if diferenca_peso > LIMITE_TOLERANCIA_PESO:
        alerta_fiscal = True
        alerta_transito = True
        bloqueio_cnpj = True

    return {
        "placa": data.placa.upper(),
        "fabricante": veiculo["fabricante"],
        "modelo": veiculo["modelo"],
        "ano": veiculo["ano"],
        "nfe_numero": veiculo["nfe_numero"],
        "valor_carga": veiculo["valor_carga"],
        "origem": veiculo["origem"],
        "destino": veiculo["destino"],
        "carga": veiculo["carga_declarada"],
        "peso_declarado": peso_declarado,
        "peso_medido": data.peso_medido_kg,
        "diferenca": diferenca_peso,
        "alertas": {
            "fiscal_sefaz": alerta_fiscal,
            "transito_daer": alerta_transito,
            "bloqueio_cnpj": bloqueio_cnpj
        },
        "acao": "BLOQUEAR VEÍCULO E NOTIFICAR CNPJ" if alerta_fiscal else "TRÂNSITO LIBERADO",
        "status": "OK"
    }