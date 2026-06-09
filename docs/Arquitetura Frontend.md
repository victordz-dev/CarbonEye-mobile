# Especificação Técnica e Arquitetura Frontend (Mobile)

## 1. Visão Geral da Arquitetura
O aplicativo CarbonEye foi desenvolvido com foco em performance, modularidade e resiliência de rede (Offline-First). A aplicação utiliza React Native com Expo SDK e é fortemente tipada com TypeScript, garantindo a ausência total de tipagens dinâmicas (any) e maior segurança no tráfego de dados.

## 2. Estrutura de Pastas e Modularização Extrema
O projeto segue uma arquitetura baseada em separação de responsabilidades (SoC), dividindo a lógica de negócio, a interface visual e a comunicação com o servidor. Recentemente, a arquitetura passou por uma componentização extrema para garantir o "Clean Code" e facilitar a manutenção:

```
└── src
    ├── components      # Componentes reutilizáveis (Skeleton, SiriBadge, AreaCard, AreaActionModals)
    │   └── Details     # Micro-componentes de domínio específico (CarbonEstimationCard, ChartNDVI, SiriComponentsCard)
    ├── config          # JSONs estruturais e de ambiente
    ├── context         # Estados globais (ThemeContext, AuthContext)
    ├── hooks           # Custom Hooks lógicos (useAreas, useAuth, useTheme)
    ├── navigation      # Configuração de navegação (Tabs e Stacks estritamente tipadas)
    ├── screens         # Telas agrupadas por domínio (Home, Map, Auth)
    ├── services        # Camada de serviços (Axios: Backend e OpenWeather)
    ├── storage         # Gerenciamento de AsyncStorage
    ├── types           # Interfaces estritas (Area, HistoricoSiri, User, Navigation)
    └── utils           # Funções puras (Turf.js, matemáticas espaciais)
```

## 3. Gerenciamento de Estado Global e Local
A arquitetura divide o estado em duas frentes para evitar abusos do `useState`:

### 3.1. Context API e AsyncStorage (Offline-First)
Utilizado para gerenciar dados que persistem na memória física do dispositivo via `AsyncStorage`:
- **`AuthContext`**: Gerencia e persiste a sessão (Token JWT e dados do usuário). Elimina a necessidade de múltiplos logins.
- **`ThemeContext`**: Salva e aplica a escolha de Light/Dark Mode em toda a árvore do app.

### 3.2. Estado de Servidor (TanStack Query)
O consumo da API é orquestrado pelo React Query (encapsulado em hooks como `useAreas`). Ele invalida caches automaticamente em caso de mutações (deleção, atualização de status de monitoramento) e substitui as renderizações custosas de `useEffect`, centralizando os estados de `isLoading` e `isError`.

## 4. Camada de Serviço e Rede (Service Layer)
A comunicação HTTP é estritamente centralizada para evitar acoplamento nas `Screens`.

### 4.1. BFF Backend (NestJS)
Uma instância Axios (`api.ts`) é utilizada para a nossa própria API, contendo Interceptors que anexam automaticamente o JWT. Alertas visuais foram desacoplados desta camada, mantendo o serviço puro e retornando os erros para as UI consumirem de forma apropriada.

### 4.2. APIs Terceirizadas no Cliente (OpenWeather)
Para obter dados climáticos sem onerar o nosso servidor e demonstrar consumo descentralizado, a tela de Detalhes consulta diretamente a API do **OpenWeather** a partir do Frontend (via `services/weather.ts`). O widget climático avalia a temperatura e dados locais em tempo real com base nas coordenadas do terreno.

## 5. Arquitetura de UI, Validação e UX Avançada

### 5.1. Formulários Dinâmicos e Validação Rigorosa (Zod)
A aplicação adota a biblioteca **Zod** para blindar todos os formulários e evitar envios errôneos para a API:
- **Cadastro (`RegisterScreen`) e Login (`LoginScreen`)**: Validações estritas garantindo e-mails válidos, CPFs autênticos (via `cpf-cnpj-validator`) e senhas com tamanho mínimo.
- **Georreferenciamento (`MapScreen`)**: O nome dos novos talhões desenhados passa por schemas do Zod para garantir limitação de caracteres (3 a 50) e integridade textual, evitando brechas.

### 5.2. Componentização "Dumb vs Smart"
A tela de análise avançada (`DetailsScreen`) atua como um "Smart Component", lidando com o React Query e a orquestração. Todo o visual massivo foi delegado a "Dumb Components" contidos em `src/components/Details/`:
- **`CarbonEstimationCard`**: Isola o cálculo de sequestro de toneladas de CO2.
- **`SiriComponentsCard`**: Isola a tabela visual de índices (NDVI, EVI, etc).
- **`ChartNDVI`**: Encapsula inteiramente o motor gráfico SVG (`react-native-svg`), incluindo seus estados locais de toggle entre linhas e barras.

### 5.3. Skeleton Loading Otimizado
O feedback visual adota o **Skeleton Loading**, renderizando um esqueleto animado opaco dos elementos (textos, gráficos, mapas) enquanto o TanStack Query resolve a requisição HTTP.

## 6. Navegação Híbrida (React Navigation)
O fluxo combina navegação por pilha (*Stack*) e navegação por abas (*Bottom Tabs*).
Todos os parâmetros são tipados estritamente via TypeScript global (`namespace ReactNavigation`).
- **Bottom Tabs**: Fluxos principais (Dashboard Home, Mapa, Histórico, Configurações).
- **Stack**: Telas de detalhe que englobam abas independentes ou modais. Uma rota nova adicionada é a "TestArea", uma interface escondida que permite injeção de Alertas Mock (Clima, NASA FIRMS, Desmatamento) na própria área do usuário para facilitar testes de validação.

## 7. Motor Geográfico Multiplataforma (Leaflet)
Ao invés do `react-native-maps`, que possuía limitações críticas em compatibilidade web e inconsistências entre renderizadores Apple Maps e Google Maps nativos, a equipe migrou o motor espacial para um contêiner **WebView carregando Leaflet JS**.

- **Event Bridge**: React Native e o Leaflet trocam mensagens assíncronas em tempo real via `postMessage`.
- **Agulhas e Labels**: Áreas previamente cadastradas são injetadas no ambiente HTML instantaneamente (via `onLoadEnd`) como polígonos acompanhados de marcadores que exibem o nome da área.
- **Cálculo Desacoplado**: O Frontend faz a coleta das marcações espaciais, valida a ausência de autointersecções no polígono e envia as coordenadas limpas para o back-end processar com a inteligência orbital.