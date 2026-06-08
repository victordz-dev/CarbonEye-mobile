# Especificação Técnica e Arquitetura Frontend (Mobile)

## 1. Visão Geral da Arquitetura
O aplicativo CarbonEye foi desenvolvido com foco em performance, modularidade e resiliência de rede (Offline-First). A aplicação utiliza React Native com Expo SDK e é fortemente tipada com TypeScript, garantindo a ausência total de tipagens dinâmicas (any) e maior segurança no tráfego de dados.

## 2. Estrutura de Pastas e Modularização (ESModules)

O projeto segue uma arquitetura baseada em separação de responsabilidades (SoC), dividindo a lógica de negócio, a interface visual e a comunicação com o servidor: 

```
└── src
    ├── components      # Componentes reutilizáveis (Skeleton, SiriBadge, DynamicForm)
    ├── config          # JSONs estruturais e de ambiente
    ├── context         # Estados globais (ThemeContext, AuthContext, FavoritesContext)
    ├── hooks           # Custom Hooks lógicos
    ├── navigation      # Configuração de navegação (Tabs e Stacks)
    ├── screens         # Telas agrupadas por domínio (Home, Map, Auth)
    ├── services        # Camada de serviços (Axios: Backend e OpenWeather)
    ├── storage         # Gerenciamento de AsyncStorage
    ├── types           # Interfaces estritas (Area, HistoricoSiri, User)
    └── utils           # Funções puras (Turf.js, geo handlers)
```

## 3. Gerenciamento de Estado Global e Local
A arquitetura divide o estado em duas frentes para evitar abusos do `useState`:

### 3.1. Context API e AsyncStorage (Offline-First)
Utilizado para gerenciar dados que persistem na memória física do dispositivo via `AsyncStorage`:
- **`AuthContext`**: Gerencia e persiste a sessão (Token JWT e dados do usuário). Elimina a necessidade de múltiplos logins.
- **`ThemeContext`**: Salva e aplica a escolha de Light/Dark Mode em toda a árvore do app.
- **`FavoritesContext`**: Persiste os IDs dos polígonos favoritos do usuário localmente.

### 3.2. Estado de Servidor (TanStack Query)
O consumo da API do NestJS é orquestrado pelo React Query. Ele invalida caches automaticamente em caso de deleções ou leituras e substitui as renderizações custosas de `useEffect`.

## 4. Camada de Serviço e Rede (Service Layer)
A comunicação HTTP é estritamente centralizada para evitar acoplamento nas `Screens`.

### 4.1. BFF Backend (NestJS)
Uma instância Axios (`api.ts`) é utilizada para a nossa própria API, contendo Interceptors que anexam automaticamente o JWT.

### 4.2. APIs Terceirizadas no Cliente (OpenWeather)
Para obter dados climáticos sem onerar o nosso servidor e demonstrar consumo descentralizado, a tela de Detalhes consulta diretamente a API do **OpenWeather** a partir do Frontend (via `services/weather.ts`). O widget climático avalia a umidade, nuvens e temperatura atual em tempo real.

## 5. Arquitetura de UI, Validação e UX Avançada

### 5.1. Formulários Dinâmicos e Validação Rigorosa (Zod)
Para o cadastro e controle de perfil, o Frontend utiliza schemas rigorosos de validação construídos com a biblioteca **Zod** acoplada ao **cpf-cnpj-validator**. CPFs inválidos ou dados mal-formatados sequer ativam o carregamento, sendo barrados em tempo de execução nativamente.

### 5.2. Skeleton Loading Otimizado
O feedback visual não é mais feito com `ActivityIndicator` padrão. O CarbonEye adota o **Skeleton Loading**, renderizando um esqueleto animado opaco dos elementos (textos, gráficos, mapas) enquanto o TanStack Query resolve a requisição HTTP. 

## 6. Navegação Híbrida (React Navigation)
O fluxo combina navegação por pilha (*Stack*) e navegação por abas (*Bottom Tabs*).
Todos os parâmetros são tipados estritamente via TypeScript.
- **Bottom Tabs**: Fluxos principais (Dashboard Home, Mapa, Histórico, Configurações). A "Home" atua estritamente como painel de monitoramento ativo, enquanto o "Histórico" lista as áreas cujo monitoramento foi desligado.
- **Stack**: Telas de detalhe que englobam abas independentes ou modais. Uma rota nova adicionada é a "TestArea", uma interface escondida que permite injeção de Alertas Mock (Clima, NASA FIRMS, Desmatamento) na própria área do usuário para facilitar testes de validação.

## 7. Motor Geográfico Multiplataforma (Leaflet)
Ao invés do `react-native-maps`, que possuía limitações críticas em compatibilidade web e inconsistências entre renderizadores Apple Maps e Google Maps nativos, a equipe migrou o motor espacial para um contêiner **WebView carregando Leaflet JS**.

- **Event Bridge**: React Native e o Leaflet trocam mensagens assíncronas em tempo real via `postMessage`.
- **Agulhas e Labels**: Áreas previamente cadastradas são injetadas no ambiente HTML instantaneamente (via `onLoadEnd`) como polígonos acompanhados de marcadores (📍) que exibem o nome da área.
- **Cálculo Desacoplado**: O Frontend faz a coleta das marcações espaciais, usa bibliotecas matemáticas para garantir os hectares, e despacha as coordenadas estruturadas como array.