# Especificação Técnica e Arquitetura Frontend (Mobile)

## 1. Visão Geral da Arquitetura
O aplicativo CarbonEye foi desenvolvido com foco em **performance**, **modularidade** e **resiliência de rede**. A aplicação utiliza **React Native** com **Expo SDK 55** e é fortemente tipada com **TypeScript**, garantindo segurança no tráfego de dados entre camadas.

A arquitetura segue os princípios de **separação de responsabilidades (SoC)**, dividindo a lógica de negócio, a interface visual e a comunicação com o servidor em camadas independentes.

## 2. Estrutura de Pastas e Modularização

```
└── src
    ├── components/         # Componentes reutilizáveis organizados por domínio
    │   ├── Details/        # CarbonEstimationCard, ChartNDVI, SiriComponentsCard, DetailsActions, DetailsHeader, DetailsStatus
    │   ├── Home/           # HomeHeader, ConsumptionWidget, HomeFilters
    │   ├── History/        # HistoryCard, HistoryFilters
    │   ├── Map/            # InteractiveMap, LeafletTemplate, MapControlPanel, MapFloatingTools, MapSearchBox
    │   ├── Settings/       # ProfileEditor, SystemMenu
    │   ├── AreaCard.tsx    # Card genérico de área reutilizado em Home e History
    │   ├── AreaActionModals.tsx  # Action Sheet + Modal de renomear (fluxo unidirecional de monitoramento)
    │   ├── WeatherWidget.tsx     # Widget climático com fallback nullish seguro
    │   ├── SiriBadge.tsx   # Badge de classificação SIRI
    │   └── Skeleton.tsx    # Skeleton Loading animado
    ├── contexts/           # Estados globais via Context API
    │   ├── AuthContext.tsx  # Sessão JWT + flush de log buffer pós-login
    │   └── ThemeContext.tsx # Light/Dark Mode persistido
    ├── hooks/              # Custom Hooks lógicos
    │   ├── queries/        # Hooks de dados do servidor (useAreas)
    │   ├── useAuth.ts      # Re-export do AuthContext
    │   ├── useTheme.ts     # Re-export do ThemeContext
    │   ├── useFavorites.ts # Gerenciamento de favoritos (AsyncStorage)
    │   └── usePushNotifications.ts  # Expo Push Notifications
    ├── navigation/         # React Navigation (Tabs + Stack tipados)
    │   └── AppNavigator.tsx
    ├── screens/            # 13 telas organizadas por domínio
    │   ├── LoginScreen.tsx / RegisterScreen.tsx  # Auth com validação Zod
    │   ├── HomeScreen.tsx        # Dashboard com FlatList virtualizada
    │   ├── MapScreen.native.tsx  # Mapa interativo (Leaflet via WebView)
    │   ├── MapScreen.web.tsx     # Fallback web do mapa
    │   ├── HistoryScreen.tsx     # Lista de áreas com filtros
    │   ├── DetailsScreen.tsx     # Laudo SIRI detalhado (dados derivados via useMemo)
    │   ├── NotificationsScreen.tsx  # Central de alertas
    │   ├── SettingsScreen.tsx    # Perfil + configurações
    │   ├── InfoScreen.tsx        # Metodologia SIRI
    │   ├── HealthCheckScreen.tsx # Telemetria de APIs
    │   └── TestAreaScreen.tsx    # Debug: gerador de alertas mock
    ├── services/           # Camada de serviços HTTP
    │   ├── api.ts          # Instância Axios com interceptors JWT + logService
    │   ├── logService.ts   # Buffer de logs com batching, debounce e rate limiting
    │   └── weather.ts      # Consumo direto da API OpenWeather
    ├── storage/            # Abstração de persistência local
    │   └── index.ts        # Wrappers tipados para AsyncStorage (token, user, favorites)
    ├── theme/              # Design System
    │   └── index.ts        # Tokens de cores (ThemeColors, lightColors, darkColors)
    ├── types/              # Interfaces TypeScript compartilhadas
    │   ├── index.ts        # Area, Alerta, User
    │   └── navigation.ts   # Tipagem estrita de rotas (RootStack, AuthStack, MainTab)
    └── utils/              # Funções utilitárias puras
        └── geo.ts          # Cálculo de área (Shoelace), detecção de autointerseção (Turf.js)
```

## 3. Gerenciamento de Estado

### 3.1. Context API + AsyncStorage (Persistência)
- **`AuthContext`**: Gerencia sessão JWT (token + dados do usuário). Integrado com o `LogService` para flush de logs bufferizados pós-login e persistência pré-logout.
- **`ThemeContext`**: Salva e aplica Light/Dark Mode em toda a árvore do app via AsyncStorage.

### 3.2. Estado de Servidor (TanStack React Query v5)
O consumo da API é orquestrado pelo React Query, encapsulado em custom hooks:
- **`useAreas`**: Query + mutations (delete, rename, disableMonitor) com invalidação automática de cache.
- Queries inline em `DetailsScreen`, `HistoryScreen`, `NotificationsScreen`, etc.
- Substitui cascatas de `useEffect` + `useState`, centralizando `isLoading` e `isError`.

### 3.3. Derivação de Estado (useMemo)
O `DetailsScreen` exemplifica a eliminação de estado duplicado: ao invés de copiar dados do React Query para states locais via `useEffect`, os valores são **derivados diretamente** via `useMemo`, reduzindo re-renders e eliminando bugs de sincronização.

## 4. Camada de Serviço e Rede

### 4.1. Backend CarbonEye (api.ts)
Instância Axios centralizada com:
- **Request Interceptor**: Injeta JWT (`Bearer`) automaticamente em todas as requisições.
- **Response Interceptor**: Detecta erros de integração (`INTEGRATION_ERROR`) e enfileira logs via `LogService`.
- **LogService** (`logService.ts`): Serviço dedicado com:
  - Buffer em memória para logs gerados antes do login (evita 401).
  - Batching com debounce de 5 segundos.
  - Throttle interno respeitando rate limit de 30 req/min.
  - Persistência do buffer no AsyncStorage para sobreviver ao fechamento do app.

### 4.2. APIs Terceirizadas (weather.ts)
Consumo direto da API **OpenWeather** no frontend para dados climáticos em tempo real, sem onerar o backend. Utiliza interceptors próprios para injetar API key e configurações.

## 5. Arquitetura de UI e UX

### 5.1. Validação de Formulários (Zod)
Todos os formulários são validados com **Zod** antes do envio:
- Login/Cadastro: e-mail, senha (min 6), CPF (via `cpf-cnpj-validator`).
- Criação de área: nome (3-50 caracteres), geometria (mín. 3 pontos, máx. 50 vértices).
- Edição de perfil: validação condicional de senha atual.

### 5.2. Componentização por Domínio
Padrão "Smart vs Dumb Components":
- **Smart Components** (Screens): Orquestram React Query, mutations e navegação.
- **Dumb Components** (components/): Recebem dados via props e são puramente visuais.

Cada domínio tem seus componentes isolados em subpastas (`Details/`, `Home/`, `History/`, `Map/`, `Settings/`), garantindo reutilização e testabilidade.

### 5.3. Skeleton Loading
Feedback visual premium com `Skeleton` animado (shimmer effect) durante carregamento dos dados do servidor, presente em HomeScreen e DetailsScreen.

### 5.4. Listas Virtualizadas (FlatList)
Todas as listas dinâmicas utilizam `FlatList` com virtualização:
- `HomeScreen`: FlatList única com `ListHeaderComponent` contendo widgets e filtros.
- `HistoryScreen`: FlatList com filtros por status e busca textual.
- `TestAreaScreen`: FlatList com `ListHeaderComponent` e `ListFooterComponent`.

### 5.5. Memoização de Performance
Callbacks pesados são envolvidos em `useCallback` para evitar re-renders desnecessários dos componentes filhos:
- `openActionMenu`, `excluirArea`, `handleDisableMonitor`, `handleExportPdf`.

## 6. Navegação (React Navigation v7)

### Estrutura Híbrida (Stack + Bottom Tabs)
```
RootStack
├── AuthNavigator (Stack)
│   ├── Login
│   └── Register
└── MainNavigator
    ├── TabNavigator (Bottom Tabs)
    │   ├── Home (Painel)
    │   ├── Map (Análise de Área)
    │   ├── History (Histórico)
    │   ├── Info (Metodologia)
    │   └── Settings (Ajustes)
    └── Modal Screens (Stack)
        ├── Details (Laudo SIRI)
        ├── HealthCheck (Telemetria)
        ├── Notifications (Central de Alertas)
        └── TestArea (Debug)
```

Todos os parâmetros são **estritamente tipados** via TypeScript global (`namespace ReactNavigation`). Apenas IDs são trafegados entre telas (sem objetos inteiros nos params).

## 7. Motor Geográfico Multiplataforma (Leaflet)

Ao invés do `react-native-maps`, que possui limitações em compatibilidade web, a equipe utiliza uma **WebView carregando Leaflet JS**:

- **HTML Inline**: O template Leaflet é gerado em `LeafletTemplate.ts` e injetado via `source={{ html }}`, sem dependência do backend (sem risco de bloqueio por CSP/Helmet).
- **Event Bridge**: React Native e Leaflet trocam mensagens assíncronas via `postMessage` / `onMessage`.
- **Áreas Pré-cadastradas**: Polígonos salvos são renderizados como overlays com labels.
- **Validação Client-side**: Detecção de autointerseção via `@turf/kinks` antes do envio ao backend.

## 8. Fluxo de Monitoramento (Regra de Negócio)

O monitoramento de áreas segue um **fluxo unidirecional irreversível**:
- O usuário pode **desativar** o monitoramento, mas **não pode reativá-lo**.
- A desativação exclui o polígono do satélite (AgroMonitoring) permanentemente.
- A UI reflete isso: o botão "Desativar" só aparece para áreas ativas, e um Alert de confirmação explícito informa sobre a irreversibilidade da ação.
- O hook `useAreas` expõe `disableMonitor(id)` ao invés de `toggleMonitor(id, boolean)`, forçando a semântica unidirecional no código.