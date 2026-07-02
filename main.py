import json
import os
import re
import random
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta

app = FastAPI(
    title="API WIM-RS — Sistema Integrado de Monitoramento HS-WIM",
    description="Motor de regras para balanças do tipo High-Speed Weigh-in-Motion (HS-WIM).",
    version="4.6.0-HSWIM-AutoSim"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RODOVIAS_RS = [
    "BR-386 (Lajeado/RS)",
    "BR-116 (Canoas/RS)",
    "RSC-287 (Santa Maria/RS)",
    "BR-290 (Freeway/RS)",
    "BR-392 (Rio Grande/RS)"
]

TABELA_CONTRAN = {
    "2C":    {"descricao": "Caminhão Toco",            "eixos": 2, "pbt_legal_kg": 16000},
    "3C":    {"descricao": "Caminhão Truck",            "eixos": 3, "pbt_legal_kg": 23000},
    "4C":    {"descricao": "Caminhão Trucado (4 Eixos)","eixos": 4, "pbt_legal_kg": 29000},
    "2S3":   {"descricao": "Carreta Simples (5 Eixos)", "eixos": 5, "pbt_legal_kg": 41500},
    "3S3":   {"descricao": "Carreta LS (6 Eixos)",      "eixos": 6, "pbt_legal_kg": 53000},
    "3S2S2": {"descricao": "Bitrem (7 Eixos)",          "eixos": 7, "pbt_legal_kg": 57000},
    "3S3S3": {"descricao": "Rodotrem (9 Eixos)",        "eixos": 9, "pbt_legal_kg": 74000},
}

FROTA_BASE = [
    {"fab": "Scania", "mod": "R 450", "ano": 2022, "qfv": "3S3", "carga": "Soja a Granel", "peso_nfe": 51500, "val": 145000, "transp": "Transportes Bertolini", "cnpj": "04.503.660/0001-55", "orig": "Ijui/RS", "dest": "Rio Grande/RS"},
    {"fab": "Volvo", "mod": "FH 540", "ano": 2023, "qfv": "3S3S3", "carga": "Fertilizantes", "peso_nfe": 72000, "val": 210000, "transp": "JSL Logistica", "cnpj": "52.548.435/0001-79", "orig": "Passo Fundo/RS", "dest": "Santa Maria/RS"},
    {"fab": "Mercedes-Benz", "mod": "Atego 2426", "ano": 2020, "qfv": "3C", "carga": "Materiais de Construcao", "peso_nfe": 21500, "val": 45000, "transp": "Bauer Express", "cnpj": "84.430.141/0001-92", "orig": "Lajeado/RS", "dest": "Porto Alegre/RS"},
    {"fab": "DAF", "mod": "XF 530", "ano": 2024, "qfv": "3S2S2", "carga": "Milho em Graos", "peso_nfe": 55800, "val": 120000, "transp": "Ouro Verde", "cnpj": "02.325.321/0001-12", "orig": "Cruz Alta/RS", "dest": "Rio Grande/RS"},
    {"fab": "Volvo", "mod": "FH 460", "ano": 2019, "qfv": "3S3", "carga": "Oleo Diesel", "peso_nfe": 52000, "val": 350000, "transp": "Tegma", "cnpj": "02.814.497/0001-43", "orig": "Canoas/RS", "dest": "Caxias do Sul/RS"},
    {"fab": "Iveco", "mod": "Hi-Way 440", "ano": 2021, "qfv": "2S3", "carga": "Bobinas de Aco", "peso_nfe": 40500, "val": 480000, "transp": "Braspress", "cnpj": "48.740.351/0001-65", "orig": "Sapucaia do Sul/RS", "dest": "Pelotas/RS"},
    {"fab": "Volkswagen", "mod": "Meteor 29.520", "ano": 2023, "qfv": "3S3S3", "carga": "Arroz", "peso_nfe": 71000, "val": 180000, "transp": "Gomes Transportes", "cnpj": "12.345.678/0001-99", "orig": "Uruguaiana/RS", "dest": "Sao Paulo/SP"},
    {"fab": "Scania", "mod": "P 360", "ano": 2018, "qfv": "4C", "carga": "Frutas e Hortaliças", "peso_nfe": 28000, "val": 65000, "transp": "Expresso Sao Miguel", "cnpj": "00.425.859/0001-14", "orig": "Bento Goncalves/RS", "dest": "Porto Alegre/RS"},
    {"fab": "Mercedes-Benz", "mod": "Actros 2651", "ano": 2022, "qfv": "3S3", "carga": "Pecas Automotivas", "peso_nfe": 48000, "val": 850000, "transp": "Bora Log", "cnpj": "14.587.963/0001-85", "orig": "Gravatai/RS", "dest": "Buenos Aires/AR"},
    {"fab": "Volvo", "mod": "VM 270", "ano": 2017, "qfv": "3C", "carga": "Bebidas", "peso_nfe": 22500, "val": 95000, "transp": "Logistica Ambev", "cnpj": "07.526.557/0001-00", "orig": "Viamao/RS", "dest": "Tramandai/RS"},
    {"fab": "DAF", "mod": "CF 410", "ano": 2021, "qfv": "2S3", "carga": "Cimento", "peso_nfe": 41000, "val": 35000, "transp": "Cimento Sul", "cnpj": "85.698.741/0001-22", "orig": "Pinheiro Machado/RS", "dest": "Santa Cruz do Sul/RS"},
    {"fab": "Scania", "mod": "R 540", "ano": 2024, "qfv": "3S2S2", "carga": "Trigo", "peso_nfe": 56000, "val": 110000, "transp": "Cargill Log", "cnpj": "60.498.706/0001-57", "orig": "Carazinho/RS", "dest": "Rio Grande/RS"},
    {"fab": "Volkswagen", "mod": "Constellation 24.280", "ano": 2016, "qfv": "3C", "carga": "Laticinios", "peso_nfe": 21000, "val": 125000, "transp": "Laticinios Pia", "cnpj": "92.658.745/0001-02", "orig": "Nova Petropolis/RS", "dest": "Caxias do Sul/RS"},
    {"fab": "Iveco", "mod": "Tector 240E28", "ano": 2020, "qfv": "3C", "carga": "Eletronicos", "peso_nfe": 18000, "val": 1500000, "transp": "Mercado Livre Log", "cnpj": "03.007.331/0001-41", "orig": "Cachoeirinha/RS", "dest": "Passo Fundo/RS"},
    {"fab": "Mercedes-Benz", "mod": "Axor 2544", "ano": 2019, "qfv": "3S3", "carga": "Madeira Beneficiada", "peso_nfe": 52500, "val": 80000, "transp": "Madeireira Silva", "cnpj": "11.222.333/0001-44", "orig": "Vacaria/RS", "dest": "Guaiba/RS"},
    {"fab": "Volvo", "mod": "FH 500", "ano": 2022, "qfv": "3S3S3", "carga": "Celulose", "peso_nfe": 73500, "val": 250000, "transp": "CMPC Logistica", "cnpj": "14.789.654/0001-33", "orig": "Guaiba/RS", "dest": "Rio Grande/RS"},
    {"fab": "Scania", "mod": "G 410", "ano": 2021, "qfv": "2S3", "carga": "Gas GLP", "peso_nfe": 40000, "val": 180000, "transp": "Ultragaz", "cnpj": "61.602.199/0001-12", "orig": "Canoas/RS", "dest": "Santa Maria/RS"},
    {"fab": "DAF", "mod": "XF 480", "ano": 2023, "qfv": "3S3", "carga": "Carnes Resfriadas", "peso_nfe": 51000, "val": 450000, "transp": "BRF Logistica", "cnpj": "01.838.723/0001-27", "orig": "Lajeado/RS", "dest": "Itajai/SC"},
    {"fab": "Mercedes-Benz", "mod": "Accelo 1016", "ano": 2018, "qfv": "2C", "carga": "Encomendas Expressas", "peso_nfe": 15500, "val": 300000, "transp": "Correios", "cnpj": "34.028.316/0001-03", "orig": "Porto Alegre/RS", "dest": "Pelotas/RS"},
    {"fab": "Volkswagen", "mod": "Delivery 11.180", "ano": 2022, "qfv": "2C", "carga": "Moveis", "peso_nfe": 14000, "val": 75000, "transp": "Modular Transportes", "cnpj": "90.123.456/0001-88", "orig": "Bento Goncalves/RS", "dest": "Florianopolis/SC"},
    {"fab": "Volvo", "mod": "FH 540", "ano": 2024, "qfv": "3S3S3", "carga": "Defensivos Agricolas", "peso_nfe": 72500, "val": 1200000, "transp": "Bayer Log", "cnpj": "18.459.628/0001-15", "orig": "Camaqua/RS", "dest": "Cruz Alta/RS"},
    {"fab": "Scania", "mod": "R 450", "ano": 2019, "qfv": "3S3", "carga": "Papel e Celulose", "peso_nfe": 52000, "val": 130000, "transp": "Klabin", "cnpj": "89.636.920/0001-65", "orig": "Otacilio Costa/SC", "dest": "Porto Alegre/RS"},
    {"fab": "Iveco", "mod": "Stralis 600S44T", "ano": 2017, "qfv": "3S2S2", "carga": "Containers", "peso_nfe": 56500, "val": 850000, "transp": "Maersk Logistica", "cnpj": "02.589.654/0001-71", "orig": "Rio Grande/RS", "dest": "Novo Hamburgo/RS"},
    {"fab": "DAF", "mod": "CF 310", "ano": 2020, "qfv": "3C", "carga": "Racao Animal", "peso_nfe": 22000, "val": 55000, "transp": "Nutron", "cnpj": "45.123.987/0001-32", "orig": "Estrela/RS", "dest": "Santa Rosa/RS"},
    {"fab": "Mercedes-Benz", "mod": "Atego 3030", "ano": 2023, "qfv": "4C", "carga": "Vidros", "peso_nfe": 28500, "val": 220000, "transp": "TransVidro", "cnpj": "78.456.123/0001-09", "orig": "Sao Paulo/SP", "dest": "Porto Alegre/RS"},
    {"fab": "Ford", "mod": "Cargo 2429", "ano": 2019, "qfv": "3C", "carga": "Refrigerantes", "peso_nfe": 22000, "val": 90000, "transp": "Rodonaves Transportes", "cnpj": "44.914.992/0001-02", "orig": "Porto Alegre/RS", "dest": "Erechim/RS"},
    {"fab": "Scania", "mod": "R 500", "ano": 2023, "qfv": "3S3", "carga": "Acucar Cristal", "peso_nfe": 52000, "val": 115000, "transp": "Copersucar Logistica", "cnpj": "47.080.619/0001-17", "orig": "Cachoeira do Sul/RS", "dest": "Rio Grande/RS"},
    {"fab": "Volvo", "mod": "FH 460", "ano": 2021, "qfv": "3S2S2", "carga": "Fertilizante NPK", "peso_nfe": 56000, "val": 175000, "transp": "Heringer Logistica", "cnpj": "22.266.175/0001-88", "orig": "Rio Grande/RS", "dest": "Cruz Alta/RS"},
    {"fab": "Mercedes-Benz", "mod": "Actros 2546", "ano": 2022, "qfv": "3S3", "carga": "Cafe Torrado", "peso_nfe": 51000, "val": 320000, "transp": "Expresso Nepomuceno", "cnpj": "25.336.030/0001-02", "orig": "Porto Alegre/RS", "dest": "Sao Paulo/SP"},
    {"fab": "DAF", "mod": "XF 480", "ano": 2024, "qfv": "3S3S3", "carga": "Etanol Anidro", "peso_nfe": 73000, "val": 260000, "transp": "Raizen Logistica", "cnpj": "33.453.598/0001-23", "orig": "Passo Fundo/RS", "dest": "Canoas/RS"},
    {"fab": "Iveco", "mod": "S-Way 540", "ano": 2023, "qfv": "3S3S3", "carga": "Soja em Graos", "peso_nfe": 72500, "val": 190000, "transp": "Amaggi Logistica", "cnpj": "77.294.254/0001-94", "orig": "Cruz Alta/RS", "dest": "Rio Grande/RS"},
    {"fab": "Volkswagen", "mod": "Meteor 28.460", "ano": 2022, "qfv": "3S3", "carga": "Racao Bovina", "peso_nfe": 51500, "val": 85000, "transp": "Nutricorp Transportes", "cnpj": "10.548.020/0001-31", "orig": "Carazinho/RS", "dest": "Bage/RS"},
    {"fab": "Scania", "mod": "G 500", "ano": 2021, "qfv": "3S2S2", "carga": "Cimento Ensacado", "peso_nfe": 56000, "val": 60000, "transp": "Votorantim Cimentos", "cnpj": "01.637.895/0001-32", "orig": "Esteio/RS", "dest": "Santa Maria/RS"},
    {"fab": "Volvo", "mod": "VM 330", "ano": 2020, "qfv": "4C", "carga": "Frangos Congelados", "peso_nfe": 28000, "val": 210000, "transp": "Sadia Logistica", "cnpj": "20.730.099/0001-94", "orig": "Marau/RS", "dest": "Porto Alegre/RS"},
    {"fab": "Mercedes-Benz", "mod": "Atego 2730", "ano": 2019, "qfv": "4C", "carga": "Leite UHT", "peso_nfe": 28500, "val": 130000, "transp": "Cooperativa Languiru", "cnpj": "96.635.780/0001-90", "orig": "Teutonia/RS", "dest": "Caxias do Sul/RS"},
    {"fab": "DAF", "mod": "CF 450", "ano": 2022, "qfv": "3S3", "carga": "Bobinas de Aco", "peso_nfe": 52500, "val": 520000, "transp": "Gerdau Logistica", "cnpj": "33.611.500/0001-19", "orig": "Sapucaia do Sul/RS", "dest": "Gravatai/RS"},
    {"fab": "Iveco", "mod": "Tector 260E28", "ano": 2021, "qfv": "3C", "carga": "Eletrodomesticos", "peso_nfe": 20000, "val": 680000, "transp": "Electrolux Logistica", "cnpj": "76.487.032/0001-25", "orig": "Canoas/RS", "dest": "Santa Rosa/RS"},
    {"fab": "Volkswagen", "mod": "Constellation 26.280", "ano": 2018, "qfv": "3C", "carga": "Moveis Planejados", "peso_nfe": 21500, "val": 160000, "transp": "Todeschini Logistica", "cnpj": "88.630.413/0001-40", "orig": "Bento Goncalves/RS", "dest": "Pelotas/RS"},
    {"fab": "Scania", "mod": "P 320", "ano": 2020, "qfv": "2S3", "carga": "Areia Lavada", "peso_nfe": 41000, "val": 25000, "transp": "Mineracao Sul", "cnpj": "05.744.311/0001-70", "orig": "Guaiba/RS", "dest": "Porto Alegre/RS"},
    {"fab": "Volvo", "mod": "FH 500", "ano": 2023, "qfv": "3S3S3", "carga": "Milho a Granel", "peso_nfe": 73000, "val": 175000, "transp": "Coamo Logistica", "cnpj": "78.590.446/0001-19", "orig": "Cruz Alta/RS", "dest": "Rio Grande/RS"},
    {"fab": "Ford", "mod": "Cargo 1719", "ano": 2018, "qfv": "2C", "carga": "Encomendas E-commerce", "peso_nfe": 15000, "val": 250000, "transp": "Total Express", "cnpj": "73.939.449/0001-30", "orig": "Porto Alegre/RS", "dest": "Novo Hamburgo/RS"},
    {"fab": "Mercedes-Benz", "mod": "Accelo 1017", "ano": 2021, "qfv": "2C", "carga": "Medicamentos", "peso_nfe": 15200, "val": 900000, "transp": "Profarma Logistica", "cnpj": "45.453.214/0001-30", "orig": "Cachoeirinha/RS", "dest": "Passo Fundo/RS"},
    {"fab": "Scania", "mod": "R 450", "ano": 2022, "qfv": "3S2S2", "carga": "Trigo em Graos", "peso_nfe": 56500, "val": 118000, "transp": "Bunge Logistica", "cnpj": "84.046.101/0001-93", "orig": "Carazinho/RS", "dest": "Rio Grande/RS"},
    {"fab": "Volvo", "mod": "FH 540", "ano": 2024, "qfv": "3S3", "carga": "Suco de Uva Concentrado", "peso_nfe": 51000, "val": 240000, "transp": "Salton Logistica", "cnpj": "88.235.874/0001-12", "orig": "Bento Goncalves/RS", "dest": "Santos/SP"},
    {"fab": "DAF", "mod": "XF 530", "ano": 2023, "qfv": "3S3S3", "carga": "Adubo Organico", "peso_nfe": 72000, "val": 95000, "transp": "Fertisul", "cnpj": "02.914.460/0001-50", "orig": "Rio Grande/RS", "dest": "Passo Fundo/RS"},
    {"fab": "Iveco", "mod": "Hi-Way 480", "ano": 2020, "qfv": "3S3", "carga": "Pneus Automotivos", "peso_nfe": 48000, "val": 620000, "transp": "Pirelli Logistica", "cnpj": "61.088.894/0001-08", "orig": "Gravatai/RS", "dest": "Uruguaiana/RS"},
    {"fab": "Volkswagen", "mod": "Delivery 13.180", "ano": 2023, "qfv": "2C", "carga": "Autopecas", "peso_nfe": 14500, "val": 190000, "transp": "DPaschoal Logistica", "cnpj": "44.281.926/0001-01", "orig": "Canoas/RS", "dest": "Caxias do Sul/RS"},
    {"fab": "Scania", "mod": "R 540", "ano": 2021, "qfv": "3S3S3", "carga": "Celulose Branqueada", "peso_nfe": 73500, "val": 245000, "transp": "CMPC Logistica", "cnpj": "14.789.654/0001-33", "orig": "Guaiba/RS", "dest": "Rio Grande/RS"},
    {"fab": "Mercedes-Benz", "mod": "Axor 2544", "ano": 2020, "qfv": "3S3", "carga": "Madeira Serrada", "peso_nfe": 52000, "val": 78000, "transp": "Madeireira Vacaria", "cnpj": "90.336.412/0001-77", "orig": "Vacaria/RS", "dest": "Guaiba/RS"},
    {"fab": "Volvo", "mod": "VM 270", "ano": 2019, "qfv": "3C", "carga": "Cerveja Artesanal", "peso_nfe": 22000, "val": 140000, "transp": "Log Ambev", "cnpj": "07.526.557/0001-00", "orig": "Viamao/RS", "dest": "Torres/RS"},
    {"fab": "DAF", "mod": "CF 410", "ano": 2022, "qfv": "2S3", "carga": "Brita Graduada", "peso_nfe": 40500, "val": 30000, "transp": "Pedreira Rio-grandense", "cnpj": "92.741.660/0001-45", "orig": "Montenegro/RS", "dest": "Osorio/RS"},
    {"fab": "Iveco", "mod": "Stralis 480", "ano": 2018, "qfv": "3S2S2", "carga": "Containers Refrigerados", "peso_nfe": 56500, "val": 780000, "transp": "Mercosul Line", "cnpj": "03.482.745/0001-66", "orig": "Rio Grande/RS", "dest": "Novo Hamburgo/RS"},
    {"fab": "Volkswagen", "mod": "Meteor 29.520", "ano": 2024, "qfv": "3S3S3", "carga": "Farelo de Soja", "peso_nfe": 72500, "val": 165000, "transp": "ADM Logistica", "cnpj": "02.003.402/0001-42", "orig": "Cruz Alta/RS", "dest": "Rio Grande/RS"},
    {"fab": "Scania", "mod": "G 410", "ano": 2020, "qfv": "2S3", "carga": "Gas GLP", "peso_nfe": 40000, "val": 185000, "transp": "Supergasbras", "cnpj": "27.163.062/0001-05", "orig": "Canoas/RS", "dest": "Bage/RS"},
    {"fab": "Ford", "mod": "Cargo 2842", "ano": 2021, "qfv": "3S3", "carga": "Vidros Planos", "peso_nfe": 52500, "val": 230000, "transp": "Cebrace Logistica", "cnpj": "60.398.138/0001-77", "orig": "Sao Paulo/SP", "dest": "Porto Alegre/RS"},
    {"fab": "Mercedes-Benz", "mod": "Atego 3033", "ano": 2023, "qfv": "4C", "carga": "Ceramica de Revestimento", "peso_nfe": 28500, "val": 175000, "transp": "Eliane Logistica", "cnpj": "84.683.408/0001-03", "orig": "Cocal do Sul/SC", "dest": "Porto Alegre/RS"},
    {"fab": "Volvo", "mod": "FH 460", "ano": 2022, "qfv": "3S3", "carga": "Papel Kraft", "peso_nfe": 52000, "val": 135000, "transp": "Klabin Logistica", "cnpj": "89.636.920/0001-65", "orig": "Otacilio Costa/SC", "dest": "Canoas/RS"}
]

HSWIM_CONFIG = {
    "vel_min_kmh": 60,
    "vel_max_kmh": 120,
    "dif_base": 0.04,
    "dif_por_kmh": 0.0008,
    "dif_pavimento": {"bom": 0.00, "regular": 0.02, "ruim": 0.05},
    "incerteza_pct": 0.05,
    "fator_triagem": 1.03,
    "tolerancia_fiscal_pct": 0.05,
    "fator_limite_eixo": 1.125,
}

ARQUIVO_DB = "banco_dados_wim.json"

def carregar_banco() -> dict:
    if not os.path.exists(ARQUIVO_DB):
        salvar_banco({"veiculos": {}, "historico_wim": [], "solicitacoes_desbloqueio": []})
    with open(ARQUIVO_DB, "r", encoding="utf-8") as f:
        return json.load(f)

def salvar_banco(dados: dict) -> None:
    with open(ARQUIVO_DB, "w", encoding="utf-8") as f:
        json.dump(dados, f, indent=4, ensure_ascii=False)

REGEX_PLACA = re.compile(r'^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$')

# AQUI ESTA A LOGICA DO CAMINHO FELIZ
def obter_veiculo_cadastrado(placa: str, eixos_lidos: int) -> dict:
    # Filtra os caminhoes do banco que tem EXATAMENTE a mesma quantidade de eixos lidos
    possiveis = [v for v in FROTA_BASE if TABELA_CONTRAN[v["qfv"]]["eixos"] == eixos_lidos]
    
    # Se encontrou algum compativel, escolhe um deles. Senao, escolhe um aleatorio (vai dar fraude inevitavelmente)
    if possiveis:
        base = random.choice(possiveis)
    else:
        base = random.choice(FROTA_BASE)
        
    return {
        "placa": placa,
        "chassi": f"9BW{random.randint(100000, 999999)}Z{random.randint(10, 99)}",
        "fabricante": base["fab"],
        "modelo": base["mod"],
        "ano": base["ano"],
        "classe_qfv": base["qfv"],
        "carga_declarada": base["carga"],
        "peso_declarado_kg": round(base["peso_nfe"] * random.uniform(0.99, 1.01)),
        "nfe_numero": f"432301{random.randint(10000000, 99999999)}",
        "valor_carga": base["val"],
        "origem": base["orig"],
        "destino": base["dest"],
        "empresa_cnpj": base["cnpj"],
        "transportadora": base["transp"]
    }

def calcular_dif(velocidade_kmh: float, condicao: str) -> float:
    dif = HSWIM_CONFIG["dif_base"] + HSWIM_CONFIG["dif_por_kmh"] * max(0, velocidade_kmh - 60)
    dif += HSWIM_CONFIG["dif_pavimento"].get(condicao, 0.0)
    return round(dif, 4)

def peso_din_para_est(peso_din: float, dif: float) -> float:
    return round(peso_din / (1.0 + dif))

def intervalo_incerteza(peso_est: float) -> dict:
    delta = round(peso_est * HSWIM_CONFIG["incerteza_pct"])
    return {"inferior_kg": peso_est - delta, "superior_kg": peso_est + delta}

def distribuir_pesos_eixos(peso_total: float, n_eixos: int) -> list:
    fatores = [random.uniform(0.8, 1.2) for _ in range(n_eixos)]
    soma = sum(fatores)
    pesos = [round((f / soma) * peso_total) for f in fatores]
    pesos[-1] += round(peso_total - sum(pesos))
    return pesos

class LeituraSensorHSWIM(BaseModel):
    placa: str
    peso_dinamico_kg: float
    velocidade_kmh: float
    eixos_lidos: int
    condicao_pavimento: str = "bom"
    rodovia: Optional[str] = None
    sensor_id: Optional[str] = None

class SolicitacaoDesbloqueio(BaseModel):
    cnpj: str
    placa: str
    nfe_numero: str
    protocolo_detran: str
    justificativa: Optional[str] = None

@app.post("/api/analisar_hswim")
def analisar_hswim(data: LeituraSensorHSWIM):
    db = carregar_banco()
    placa_upper = data.placa.upper().strip()

    vel_min = HSWIM_CONFIG["vel_min_kmh"]
    vel_max = HSWIM_CONFIG["vel_max_kmh"]
    if not (vel_min <= data.velocidade_kmh <= vel_max):
        return {
            "status": "AVISO",
            "mensagem": f"Velocidade {data.velocidade_kmh} km/h fora da faixa operacional HS-WIM ({vel_min}-{vel_max} km/h).",
        }

    if data.condicao_pavimento not in HSWIM_CONFIG["dif_pavimento"]:
        raise HTTPException(status_code=422, detail="condicao_pavimento deve ser bom, regular ou ruim.")

    veiculo = db["veiculos"].get(placa_upper)
    if not veiculo:
        if REGEX_PLACA.match(placa_upper):
            # Passando os eixos lidos para garantir o caminho feliz
            veiculo = obter_veiculo_cadastrado(placa_upper, data.eixos_lidos)
            db["veiculos"][placa_upper] = veiculo
        else:
            return {"status": "ERRO", "mensagem": "Placa fora do padrao Mercosul/Nacional."}

    sigla = veiculo["classe_qfv"]
    regra = TABELA_CONTRAN.get(sigla)
    if not regra:
        return {"status": "ERRO", "mensagem": f"Classe desconhecida: {sigla}"}

    peso_declarado = veiculo["peso_declarado_kg"]
    pbt_legal = regra["pbt_legal_kg"]
    eixos_oficiais = regra["eixos"]

    dif = calcular_dif(data.velocidade_kmh, data.condicao_pavimento)
    peso_estatico_est = peso_din_para_est(data.peso_dinamico_kg, dif)
    
    tol_fiscal = round(peso_declarado * HSWIM_CONFIG["tolerancia_fiscal_pct"])
    peso_limite_fiscal = peso_declarado + tol_fiscal
    diferenca = peso_estatico_est - peso_declarado

    limite_eixo = round((pbt_legal / eixos_oficiais) * HSWIM_CONFIG["fator_limite_eixo"])
    pesos_eixos = distribuir_pesos_eixos(peso_estatico_est, data.eixos_lidos)
    eixos_sobrepeso = [i + 1 for i, p in enumerate(pesos_eixos) if p > limite_eixo]
    
    divergencia_eixos = data.eixos_lidos != eixos_oficiais

    retem_estatica = (
        peso_estatico_est > pbt_legal * HSWIM_CONFIG["fator_triagem"]
        or divergencia_eixos
        or len(eixos_sobrepeso) > 0
    )
    alerta_fiscal = peso_estatico_est > peso_limite_fiscal
    alerta_transito = peso_estatico_est > pbt_legal or divergencia_eixos or len(eixos_sobrepeso) > 0

    if retem_estatica:
        acao = "RETER PARA PESAGEM ESTATICA"
    elif alerta_fiscal or alerta_transito:
        acao = "AUTUACAO - NOTIFICAR SEFAZ/DAER"
    else:
        acao = "TRANSITO LIBERADO"

    rodovia_atual = data.rodovia if data.rodovia else random.choice(RODOVIAS_RS)

    registro = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "placa": placa_upper,
        "rodovia": rodovia_atual,
        "velocidade_kmh": data.velocidade_kmh,
        "peso_dinamico_kg": data.peso_dinamico_kg,
        "dif": dif,
        "peso_estatico_estimado_kg": peso_estatico_est,
        "status": acao,
        # Descricao completa do veiculo simulado (para auditoria no historico)
        "fabricante": veiculo["fabricante"],
        "modelo": veiculo["modelo"],
        "ano": veiculo["ano"],
        "classe_qfv": sigla,
        "descricao_classe": regra["descricao"],
        "eixos_lidos": data.eixos_lidos,
        "eixos_oficiais": eixos_oficiais,
        "carga": veiculo["carga_declarada"],
        "transportadora": veiculo.get("transportadora", "N/D"),
        "empresa_cnpj": veiculo["empresa_cnpj"],
        "origem": veiculo["origem"],
        "destino": veiculo["destino"],
        "peso_declarado_kg": peso_declarado,
        "pbt_legal_kg": pbt_legal,
        # Dados fiscais e de telemetria para o bloco expandivel de auditoria
        "nfe_numero": veiculo["nfe_numero"],
        "valor_carga": veiculo["valor_carga"],
        "diferenca_kg": diferenca,
        "limite_por_eixo_kg": limite_eixo,
        "pesos_por_eixo_kg": pesos_eixos,
        "eixos_em_sobrepeso": eixos_sobrepeso,
        "alertas": {
            "fiscal_sefaz": alerta_fiscal,
            "transito_daer": alerta_transito,
            "divergencia_eixos": divergencia_eixos,
            "sobrepeso_eixo": len(eixos_sobrepeso) > 0,
        },
    }
    db["historico_wim"].append(registro)
    salvar_banco(db)

    return {
        "placa": placa_upper,
        "rodovia": rodovia_atual,
        "fabricante": veiculo["fabricante"],
        "modelo": veiculo["modelo"],
        "ano": veiculo["ano"],
        "nfe_numero": veiculo["nfe_numero"],
        "valor_carga": veiculo["valor_carga"],
        "origem": veiculo["origem"],
        "destino": veiculo["destino"],
        "carga": veiculo["carga_declarada"],
        "empresa_cnpj": veiculo["empresa_cnpj"],
        "transportadora": veiculo.get("transportadora", "N/D"),
        "hswim": {
            "peso_dinamico_kg": data.peso_dinamico_kg,
            "velocidade_kmh": data.velocidade_kmh,
            "condicao_pavimento": data.condicao_pavimento,
            "fator_impacto_dinamico_dif": dif,
            "peso_estatico_estimado_kg": peso_estatico_est,
        },
        "peso_declarado_kg": peso_declarado,
        "pbt_legal_kg": pbt_legal,
        "diferenca_kg": diferenca,
        "classe_qfv": sigla,
        "descricao_classe": regra["descricao"],
        "eixos_oficiais": eixos_oficiais,
        "eixos_lidos": data.eixos_lidos,
        "divergencia_eixos": divergencia_eixos,
        "pesos_por_eixo_kg": pesos_eixos,
        "limite_por_eixo_kg": limite_eixo,
        "eixos_em_sobrepeso": eixos_sobrepeso,
        "alertas": {
            "fiscal_sefaz": alerta_fiscal,
            "transito_daer": alerta_transito,
            "bloqueio_cnpj": alerta_fiscal,
            "sobrepeso_eixo": len(eixos_sobrepeso) > 0,
            "divergencia_eixos": divergencia_eixos,
        },
        "acao": acao,
        "status": "OK",
    }

@app.get("/api/historico")
def historico(limite: int = Query(50, le=500), placa: Optional[str] = None):
    db = carregar_banco()
    hist = db.get("historico_wim", [])
    if placa: hist = [h for h in hist if h["placa"] == placa.upper()]
    return {"total": len(hist), "registros": list(reversed(hist[-limite:]))}

@app.get("/api/estatisticas")
def estatisticas(periodo: str = Query("mensal", pattern="^(diario|semanal|mensal|todos)$")):
    db = carregar_banco()
    hist = db.get("historico_wim", [])

    # Filtro temporal por periodo (diario / semanal / mensal / todos)
    agora = datetime.now()
    janelas = {"diario": 1, "semanal": 7, "mensal": 30}
    if periodo in janelas:
        limite_data = agora - timedelta(days=janelas[periodo])

        def dentro_periodo(h):
            try:
                return datetime.strptime(h["timestamp"], "%Y-%m-%d %H:%M:%S") >= limite_data
            except (KeyError, ValueError):
                return False

        hist = [h for h in hist if dentro_periodo(h)]

    if not hist:
        return {"total_passagens": 0, "distribuicao_acoes": {}, "velocidade_media_kmh": 0, "fluxo_horario": [], "periodo": periodo, "agrupamento": "hora"}

    # Agrupamento adaptativo: por hora no modo diario, por dia nos demais
    agrupa_por_hora = periodo == "diario"

    acoes = {}
    vel_soma = 0.0
    fluxo = {}  # label -> [chave_ordenacao, contagem]

    for h in hist:
        s = h.get("status", "?")
        acoes[s] = acoes.get(s, 0) + 1
        vel_soma += h.get("velocidade_kmh", 0)

        ts = h.get("timestamp")
        if not ts:
            continue
        if agrupa_por_hora:
            label = ts.split(" ")[1][:2] + ":00"
            chave = label
        else:
            data_iso = ts.split(" ")[0]  # YYYY-MM-DD
            p = data_iso.split("-")
            label = f"{p[2]}/{p[1]}"      # DD/MM
            chave = data_iso
        if label not in fluxo:
            fluxo[label] = [chave, 0]
        fluxo[label][1] += 1

    bar_data = [{"hora": k, "passagens": v[1]} for k, v in sorted(fluxo.items(), key=lambda x: x[1][0])]

    return {
        "total_passagens": len(hist),
        "distribuicao_acoes": acoes,
        "velocidade_media_kmh": round(vel_soma / len(hist), 1),
        "fluxo_horario": bar_data,
        "periodo": periodo,
        "agrupamento": "hora" if agrupa_por_hora else "dia"
    }

@app.post("/api/solicitar_desbloqueio")
def solicitar_desbloqueio(req: SolicitacaoDesbloqueio):
    db = carregar_banco()
    protocolo = f"WIM-RS-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
    reg = {"protocolo": protocolo, "cnpj": req.cnpj, "placa": req.placa.upper(), "status": "EM_ANALISE"}
    if "solicitacoes_desbloqueio" not in db: db["solicitacoes_desbloqueio"] = []
    db["solicitacoes_desbloqueio"].append(reg)
    salvar_banco(db)
    return {"status": "SOLICITACAO_REGISTRADA", "protocolo": protocolo, "mensagem": "Analise iniciada."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)