# Rota Pesada 🚛💨

> **Status do Projeto:** MVP (Mínimo Produto Viável) em Desenvolvimento
> **Stack Principal:** Next.js 14+ (App Router), Tailwind CSS, Supabase (PostgreSQL + PostGIS), Mapbox GL JS.

---

## 1. Visão Geral do Sistema
O **Rota Pesada** é um sistema de roteirização e GPS especializado para veículos de carga pesada (caminhões e carretas). Ao contrário dos navegadores convencionais (Google Maps, Waze), o foco absoluto do Rota Pesada é garantir a segurança e a viabilidade financeira da rota, evitando que o motorista colida com estruturas de baixa estatura (trincheiras, viadutos, fiação), trafegue por vias com restrição de peso (PBT) ou eixos, e caia em zonas de restrição urbana sem autorização.

### 🌟 Pilares Fundamentais:
1. **Acessibilidade Extrema (UI/UX para Terceira Idade):** O público-alvo inclui motoristas experientes, mas frequentemente leigos em tecnologia. A interface deve possuir fontes gigantes, botões massivos, modo escuro de alto contraste nativo e comandos diretos, projetados para uso com o celular fixado no painel do caminhão em movimento.
2. **Camada de Inteligência Espacial (PostGIS):** Não recalculamos malhas cartográficas globais; adicionamos uma camada proprietária de restrições geométricas sobre mapas existentes.
3. **Crowdsourcing Gamificado:** Permite que os motoristas alimentem a base de dados em tempo real ao identificar novos obstáculos na pista.

---

## 2. Arquitetura Técnica & Stack
* **Frontend / Client:** Next.js 14+ (App Router) estilizado com Tailwind CSS e Lucide React para ícones. Convertido em aplicação mobile híbrida/PWA responsiva.
* **Banco de Dados & Backend:** Supabase (Postgres) com a extensão geográfica **PostGIS** habilitada para queries espaciais de proximidade e intersecção de rotas.
* **Engine de Mapas:** Mapbox GL JS (utilizando camadas customizadas via GeoJSON e Mapbox Truck Routing API para caminhos compatíveis com gabaritos pesados).
* **Alertas por Voz:** Web Speech API integrada nativamente no navegador para alertas em áudio (*Voice-First Interaction*), evitando distração visual do motorista.

---

## 3. Modelagem do Banco de Dados (Supabase - PostGIS)

### `truck_profiles` (Perfis de Caminhão dos Usuários)
* `id`: uuid (PK)
* `user_id`: uuid (FK -> auth.users)
* `name`: text (Ex: "Minha Carreta Bitrem")
* `height`: numeric (Altura em metros, ex: 4.40)
* `weight_pbt`: numeric (Peso Bruto Total em toneladas)
* `axles`: integer (Número de eixos para cálculo de pedágio)
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
* [ ] Setup do projeto Next.js + Tailwind + Supabase Client.
* [ ] Tela simplificada de cadastro do Caminhão (Altura, Peso, Eixos).
* [ ] Persistência de dados no Supabase vinculada ao Auth.

### [Fase 2] Mapa Base & Roteamento Específico
* [ ] Integração do mapa Mapbox com tema escuro de alto contraste.
* [ ] Ativação do monitoramento contínuo de posição (`navigator.geolocation.watchPosition`) com alta precisão.
* [ ] Implementação da API de Rotas de Caminhão do Mapbox passando as restrições de `height` e `weight_pbt`.

### [Fase 3] Motor de Alerta de Proximidade (O Core)
* [ ] Criação de query PostGIS (RPC no Supabase) que calcula se a posição atual do motorista está a menos de 500 metros de um ponto na tabela `restrictions` cuja altura cadastrada seja menor ou igual à do caminhão ativo.
* [ ] Disparo de interface visual em tela cheia (Card Amarelo/Vermelho de Alerta).
* [ ] Disparo do alerta falado: *"Atenção: Viaduto baixo a 500 metros. Altura máxima X metros."*

### [Fase 4] Botão "Reportar Perigo" (Crowdsourcing)
* [ ] Botão flutuante gigante na tela de navegação para registrar obstáculo.
* [ ] Ao clicar, o sistema captura a coordenada exata de GPS atual e envia instantaneamente para a tabela `restrictions` com o status `pendente_validacao`.

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