# Schema — entrada de API no catálogo do Monitor de Gravata

Cada API vira UM objeto JSON neste formato exato (array de objetos por arquivo). Campos em PT-BR.

```json
{
  "id": "portal-transparencia-federal",
  "nome": "Portal da Transparência — API de Dados",
  "orgao": "CGU (Controladoria-Geral da União)",
  "esfera": "federal",
  "uf": "BR",
  "categorias": ["contratos", "servidores", "sancoes", "despesas", "beneficios"],
  "base_url": "https://api.portaldatransparencia.gov.br/api-de-dados",
  "docs_url": "https://api.portaldatransparencia.gov.br/swagger-ui/index.html",
  "auth": "chave-gratuita",
  "auth_como": "Cadastro em portaldatransparencia.gov.br/api-de-dados/cadastrar-email; header chave-api-dados",
  "formato": ["json"],
  "cors": "nao",
  "rate_limit": "90 req/min (6h-24h) / 300 req/min fora",
  "endpoints_chave": [
    { "metodo": "GET", "path": "/contratos?codigoOrgao=26000&pagina=1", "descricao": "Contratos por órgão" },
    { "metodo": "GET", "path": "/ceis?pagina=1", "descricao": "Empresas inidôneas e suspensas" }
  ],
  "utilidade_anticorrupcao": "Cruzar contratos x sanções x servidores x emendas. Base do 'Ficha do Político' e 'Radar de Contratos'.",
  "status_verificado": "2026-08-17 ok",
  "exemplo_resposta": "{...trecho curto...}",
  "notas": "Rate limit rígido; sem CORS (usar proxy server-side)."
}
```

**Valores permitidos**
- `esfera`: `federal` | `estadual` | `municipal` | `legislativo` | `judiciario` | `eleitoral` | `controle` | `economico` | `civil` (sociedade civil / agregadores)
- `auth`: `nenhuma` | `chave-gratuita` | `token` | `oauth` | `bulk-download` (sem API, só CSV/ZIP)
- `cors`: `sim` | `nao` | `desconhecido`
- `status_verificado`: `"YYYY-MM-DD ok"` | `"YYYY-MM-DD falhou: <motivo>"` | `"nao-testado"`

**Regras**
1. TESTAR com `curl -sS -m 20` pelo menos 1 endpoint de cada API quando não exigir auth. Registrar status real.
2. `base_url` sem barra final. `endpoints_chave` com pelo menos 2 quando existir.
3. Preferir fontes primárias (gov.br, .jus.br, .leg.br). Agregadores da sociedade civil entram com `esfera: civil`.
4. Escrever o arquivo JSON **válido** (sem comentários, sem vírgula sobrando).
