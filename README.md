# Rota Pesada 🚛💨

> **Status do Projeto:** MVP (Mínimo Produto Viável) em Desenvolvimento
> **Stack Principal:** Next.js 14+ (App Router), Tailwind CSS, Supabase (PostgreSQL + PostGIS), Mapbox GL JS (mapa + busca), OpenRouteService (roteamento de caminhão).

---

## 1. Visão Geral do Sistema
O **Rota Pesada** é um sistema de roteirização e GPS especializado para veículos de carga pesada (caminhões e carretas). Ao contrário dos navegadores convencionais (Google Maps, Waze), o foco absoluto do Rota Pesada é garantir a segurança e a viabilidade financeira da rota, evitando que o motorista colida com estruturas de baixa estatura (trincheiras, viadutos, fiação), trafegue por vias com restrição de peso (PBT) ou eixos, e caia em zonas de restrição urbana sem autorização.

### 🌟 Pilares Fundamentais:
1. **Acessibilidade Extrema (UI/UX para Terceira Idade):** O público-alvo inclui motoristas experientes, mas frequentemente leigos em tecnologia. A interface deve possuir fontes gigantes, botões massivos, modo escuro de alto contraste nativo e comandos diretos, projetados para uso com o celular fixado no painel do caminhão em movimento.
2. **Roteamento por Gabarito + Camada Espacial (PostGIS):** A rota é calculada por um motor de roteamento de **caminhão** (OpenRouteService, perfil HGV) que **já evita** vias incompatíveis com o gabarito do veículo (altura, peso, largura, comprimento). Sobre ele aplicamos nossa camada proprietária de restrições (PostGIS) como **áreas a evitar** no cálculo e como alertas em tempo real — cobrindo o que o mapa-base não conhece.
3. **Crowdsourcing Gamificado:** Permite que os motoristas alimentem a base de dados em tempo real ao identificar novos obstáculos na pista; com confirmações de outros motoristas, a restrição vira "verificada" e passa a moldar as rotas.

### 🧭 Roteamento Proativo por Veículo (o Core)
O usuário cadastra o **gabarito** do caminhão (altura, peso PBT, largura, comprimento, eixos). Ao pesquisar um destino, a rota **já é traçada evitando** o que aquele veículo não pode enfrentar — viadutos/pontes baixas, vias com restrição de peso e ruas estreitas/urbanas incompatíveis com veículos grandes — em vez de só avisar ao se aproximar. Motor: OpenRouteService `driving-hgv` recebendo o gabarito + as nossas restrições (PostGIS) como `avoid_polygons`. O alerta de proximidade por voz funciona como **rede de segurança** sobre uma rota já correta. (O Mapbox **não** faz roteamento de caminhão — entra só para o mapa e a busca; sem chave do ORS, o app cai num fallback de rota de carro evitando apenas nossos pontos.)

---

## 2. Arquitetura Técnica & Stack
* **Frontend / Client:** Next.js 14+ (App Router) estilizado com Tailwind CSS e Lucide React para ícones. Convertido em aplicação mobile híbrida/PWA responsiva.
* **Banco de Dados & Backend:** Supabase (Postgres) com a extensão geográfica **PostGIS** habilitada para queries espaciais de proximidade e intersecção de rotas.
* **Engine de Mapas:** Mapbox GL JS (render do mapa escuro + camadas GeoJSON) e **Geocoding do Mapbox** (busca de destino).
* **Engine de Roteamento:** **OpenRouteService** — perfil `driving-hgv` (caminhão), recebendo o gabarito do veículo (`height`, `width`, `length`, `weight`, carga por eixo) e as nossas restrições como `avoid_polygons`. O Mapbox **não** oferece roteamento de caminhão.
* **Alertas por Voz:** Web Speech API integrada nativamente no navegador para alertas em áudio (*Voice-First Interaction*), evitando distração visual do motorista.

---

## 3. Modelagem do Banco de Dados (Supabase - PostGIS)

### `truck_profiles` (Perfis de Caminhão dos Usuários)
* `id`: uuid (PK)
* `user_id`: uuid (FK -> auth.users)
* `name`: text (Ex: "Minha Carreta Bitrem")
* `height`: numeric (Altura em metros, ex: 4.40)
* `weight_pbt`: numeric (Peso Bruto Total em toneladas)
* `axles`: integer (Número de eixos; cálculo de pedágio e carga por eixo)
* `width`: numeric (Largura em metros, ex: 2.60)
* `length`: numeric (Comprimento em metros, ex: 18.5)
* `is_active`: boolean (Se é o veículo atualmente em uso)

### `restrictions` (Base de Dados Geográfica de Perigos)
* `id`: bigint (PK)
* `type`: text (Valores: 'altura', 'peso', 'largura', 'rodizio')
* `value`: numeric (Ex: 4.20 para altura máxima de ponte)
* `geom`: geometry(Point, 4326) (Indexado com GIST para buscas geoespaciais ultra rápidas)
* `street_name`: text (Nome aproximado da via)
* `status`: text (Valores: 'verificado', 'pendente_validacao')
* `created_at`: timestamp

### `user_reports` (Logs de Crowdsourcing)
* `id`: bigint (PK)
* `user_id`: uuid (FK)
* `restriction_id`: bigint (FK)
* `photo_url`: text (Upload de imagem da placa do viaduto se houver)
* `created_at`: timestamp

---

## 4. Funcionalidades do MVP (Roadmap de Escopo)

### [Fase 1] Dashboard & Perfil do Veículo
* [x] Setup do projeto Next.js + Tailwind + Supabase Client.
* [x] Tela de cadastro do Caminhão (Altura, Peso, **Largura, Comprimento**, Eixos).
* [x] Persistência de dados no Supabase vinculada ao Auth (login anônimo, promovível a e-mail/telefone).

### [Fase 2] Mapa Base & Roteamento Específico
* [x] Integração do mapa Mapbox com tema escuro de alto contraste.
* [x] Monitoramento contínuo de posição (`navigator.geolocation.watchPosition`) com alta precisão.
* [x] Roteamento de caminhão via **OpenRouteService (driving-hgv)** passando todo o gabarito (`height`, `width`, `length`, `weight_pbt`, eixos) + nossas restrições como `avoid_polygons` — a rota já vem desviada. Busca de destino via Geocoding do Mapbox; histórico de rotas.

### [Fase 3] Motor de Alerta de Proximidade (O Core)
* [x] Query PostGIS (RPC `restricoes_proximas`, `ST_DWithin`) que retorna restrições a ≤ 500 m com altura ≤ a do caminhão ativo.
* [x] Interface visual de alerta (HUD âmbar piscante de alto contraste).
* [x] Alerta falado (pt-BR) com cooldown de 2 min por restrição: *"Atenção motorista: viaduto baixo à frente..."*.

### [Fase 4] Botão "Reportar Perigo" (Crowdsourcing)
* [x] Botão flutuante gigante para registrar obstáculo (captura o GPS e insere em `restrictions` como `pendente_validacao`).
* [x] Validação por outros motoristas (foto da placa via Storage); com 3 confirmações distintas, vira `verificado` e passa a moldar as rotas (`avoid_polygons`).

---

## 5. Diretrizes de UI/UX para o Claude (Prompt Geral)
Sempre que gerar ou alterar componentes visuais para este projeto, obedeça às seguintes regras rígidas de interface:
* **Tema:** Escuro por padrão. Cores dominantes: `#111827` (Fundo), `#FFFFFF` (Textos principais), `#F59E0B` (Amarelo Alerta para botões e sinalizações).
* **Botões:** Altura mínima de `64px` ou `h-16` no Tailwind. Espaçamento largo para evitar cliques errados causados por trepidação do veículo.
* **Fontes:** Títulos e indicadores de navegação devem usar `text-2xl` a `text-5xl` com fonte `font-black` ou `font-bold`.
* **Menus:** Evite menus suspensos, hambúrguer ou modais escondidos de difícil acesso. Informações críticas devem estar expostas diretamente no painel inferior ou superior.

---

## 6. Comandos Úteis para Desenvolvimento
```bash
# Iniciar servidor local
npm run dev

# Sincronizar types do Supabase
npx supabase gen types typescript --project-id seu-id > types/supabase.ts