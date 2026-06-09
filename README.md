# 🛰️ CarbonEye — Frontend Mobile

<div align="center">

**Plataforma de Monitoramento Ambiental com Inteligência Geoespacial**

[![React Native](https://img.shields.io/badge/React_Native-0.83-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo_SDK_55-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)](https://tanstack.com/query)

[Backend API](https://github.com/victordz-dev/CarbonEye-api) · [Swagger (Produção)](https://carboneye-api.onrender.com/api/docs) · [Documentação de Arquitetura](./docs/Arquitetura%20Frontend.md)

</div>

---

## 📋 Sobre o Projeto

O **CarbonEye** é uma plataforma digital de análise e monitoramento ambiental que utiliza **sensoriamento remoto**, **geoprocessamento vetorial** e **inteligência climática** para avaliar o risco ecológico de áreas rurais ou ambientais no território brasileiro.

Este repositório contém o **frontend mobile**, desenvolvido em **React Native + Expo + TypeScript**, que permite:

- 🗺️ **Desenhar polígonos** sobre mapas interativos para delimitar áreas de interesse
- 🛰️ **Receber análises orbitais** com dados de satélites (Sentinel-2, NDVI, EVI, NDWI)
- 📊 **Visualizar o índice SIRI** (Satellite Environmental Risk Index) de 0 a 100
- 🔥 **Monitorar focos de incêndio** em tempo real (NASA FIRMS)
- ☁️ **Consultar dados climáticos** ao vivo (OpenWeather)
- 📄 **Exportar laudos técnicos** em PDF
- 🔔 **Receber notificações push** de alertas ambientais

### 🌱 Alinhamento com ODS da ONU

| ODS | Descrição |
|---|---|
| ODS 13 | Ação contra a mudança global do clima |
| ODS 15 | Vida terrestre — proteção de ecossistemas |
| ODS 9 | Indústria, inovação e infraestrutura |
| ODS 2 | Agricultura sustentável |

---

## 👥 Integrantes da Equipe

| Nome | RM |
|---|---|
| Guilherme Oliveira | 558797 |
| Matheus Dantas | 558804 |
| Rafael Panhoca | 555014 |
| Silas Alves | 555020 |
| Victor Rodriguez | 559094 |

---

## 📱 Funcionalidades

### 🏠 Dashboard (Home)
- Painel principal com áreas monitoradas ativas
- Widget de consumo de cota (hectares monitorados)
- Filtros por status (Normal, Alerta, Emergência), favoritos e ordenação
- Badge SIRI com classificação visual por cores

### 🗺️ Mapa Interativo (Análise de Área)
- Desenho de polígonos sobre mapa Leaflet em tempo real
- Busca por coordenadas (latitude, longitude)
- Validação client-side de autointerseção (Turf.js)
- Análise geoespacial via satélite com loading animado progressivo
- Salvamento de áreas com monitoramento orbital ativo

### 📋 Histórico
- Lista completa de áreas cadastradas (ativas e inativas)
- Filtros por status e busca textual
- Sistema de favoritos persistido localmente (AsyncStorage)
- Exclusão de áreas com confirmação

### 📊 Detalhes (Laudo SIRI)
- Score SIRI com classificação visual (Normal / Alerta / Emergência)
- Componentes orbitais: NDVI, EVI, NDWI, Umidade do Solo, Temperatura
- Gráfico interativo de evolução NDVI por ano
- Estimativa de sequestro de carbono (toneladas CO₂/ha)
- Widget climático ao vivo (OpenWeather) ou snapshot histórico
- Exportação de laudo técnico em PDF
- Desativação irreversível de monitoramento (com modal de confirmação)

### 🔔 Notificações
- Central de alertas (Incêndio, Clima, Relatório)
- Marcação como lida e exclusão individual
- Download direto de relatórios PDF

### ⚙️ Configurações
- Edição de perfil (nome, e-mail, senha)
- Dark Mode / Light Mode persistido
- Diagnóstico de APIs (Health Check com latência)
- Área de testes para geração de alertas mock
- Exclusão de conta

---

## 🧠 Tecnologias e Bibliotecas

| Camada | Tecnologia |
|---|---|
| **Framework** | React Native 0.83 + Expo SDK 55 |
| **Linguagem** | TypeScript (strict) |
| **Navegação** | React Navigation v7 (Stack + Bottom Tabs) |
| **Estado de Servidor** | TanStack React Query v5 |
| **Estado Global** | Context API (Auth + Theme) |
| **Persistência** | AsyncStorage |
| **HTTP** | Axios (interceptors JWT + LogService com buffer/batching) |
| **Validação** | Zod + cpf-cnpj-validator |
| **Mapas** | Leaflet JS via WebView (multiplataforma) |
| **Geoprocessamento** | Turf.js (@turf/kinks) |
| **Gráficos** | react-native-svg |
| **Ícones** | lucide-react-native |
| **Notificações** | Expo Notifications (Push) |
| **Design System** | Tokens de cor customizados (Light/Dark) |

---

## 🧱 Arquitetura do Projeto

> 📄 **Documentação completa:** [Arquitetura Frontend.md](./docs/Arquitetura%20Frontend.md)

```
src/
├── components/          # Componentes reutilizáveis organizados por domínio
│   ├── Details/         # CarbonEstimationCard, ChartNDVI, SiriComponentsCard, etc.
│   ├── Home/            # HomeHeader, ConsumptionWidget, HomeFilters
│   ├── History/         # HistoryCard, HistoryFilters
│   ├── Map/             # InteractiveMap, LeafletTemplate, MapControlPanel
│   └── Settings/        # ProfileEditor, SystemMenu
├── contexts/            # Context API (AuthContext, ThemeContext)
├── hooks/               # Custom Hooks (useAreas, useAuth, useTheme, useFavorites)
│   └── queries/         # Hooks de dados do servidor
├── navigation/          # React Navigation (AppNavigator)
├── screens/             # 13 telas da aplicação
├── services/            # Camada de serviços HTTP
│   ├── api.ts           # Axios + interceptors JWT + logService
│   ├── logService.ts    # Buffer de logs com batching e rate limiting
│   └── weather.ts       # API OpenWeather
├── storage/             # AsyncStorage wrappers tipados
├── theme/               # Design tokens (cores Light/Dark)
├── types/               # Interfaces TypeScript (Area, User, Navigation)
└── utils/               # Funções utilitárias (geo, cálculos espaciais)
```

### Destaques Arquiteturais

- **Service Layer**: Toda comunicação HTTP é centralizada em `services/`, com interceptors para JWT automático e logging resiliente.
- **LogService**: Buffer inteligente que acumula logs antes do login e envia em batch após autenticação, respeitando rate limits.
- **Derivação de Estado**: Dados do React Query são derivados via `useMemo` ao invés de duplicados em `useState`, eliminando bugs de sincronização.
- **Listas Virtualizadas**: Todas as listas dinâmicas usam `FlatList` com `ListHeaderComponent`, nunca `ScrollView` com `.map()`.
- **Monitoramento Unidirecional**: A desativação de monitoramento é irreversível no código — o hook `disableMonitor` não aceita reativação.

---

## 🚀 API em Produção

O backend está em **deploy contínuo** e disponível para teste:

- **URL Base:** `https://carboneye-api.onrender.com`
- **Swagger UI:** [https://carboneye-api.onrender.com/api/docs](https://carboneye-api.onrender.com/api/docs)

> ⚠️ O Render Free Tier hiberna após 15min de inatividade. A primeira requisição pode levar ~50 segundos.

---

## ⚙️ Configuração e Execução

### Pré-requisitos
- **Node.js** >= 18
- **Expo Go** instalado no dispositivo móvel (App Store / Google Play) **OU** emuladores (Android Studio / Xcode)
- **Backend CarbonEye** rodando localmente ou em produção

### 1. Clonar e instalar dependências

```bash
git clone https://github.com/victordz-dev/CarbonEye-mobile.git
cd CarbonEye-mobile
npm install
```

### 2. Configurar URL do Backend

No arquivo `src/services/api.ts`, a URL já está configurada:
- **Produção:** `https://carboneye-api.onrender.com` (padrão)
- **Desenvolvimento (emulador Android):** `http://192.168.0.7:3000`
- **Desenvolvimento (iOS/Web):** `http://localhost:3000`

> O app detecta automaticamente o ambiente via `__DEV__` e `Platform.OS`.

### 🔑 API Key do OpenWeather (Hardcoded)

A chave da API do **OpenWeather** está propositalmente hardcoded no arquivo `src/services/weather.ts` para facilitar a avaliação e testes por parte do professor, sem necessidade de configuração adicional ou criação de conta em serviços externos.

```typescript
// src/services/weather.ts
const OPENWEATHER_API_KEY = "36211b75622fcd873ce2cb20b97b928d";
```

> ⚠️ **Nota:** Em um ambiente de produção real, esta chave seria armazenada em variáveis de ambiente (`.env`) e injetada via `expo-constants`. A decisão de mantê-la no código-fonte é exclusivamente para fins acadêmicos, garantindo que o app funcione imediatamente após `npm install` + `npx expo start` em qualquer máquina.

### 3. Executar o servidor Expo

```bash
npx expo start
```

### 4. Conectar dispositivo

| Plataforma | Comando |
|---|---|
| 📱 **Celular (Expo Go)** | Escaneie o QR Code com a câmera (iOS) ou Expo Go (Android) |
| 🤖 **Emulador Android** | Pressione `a` no terminal |
| 🍎 **Emulador iOS** | Pressione `i` no terminal |
| 🌐 **Navegador Web** | Pressione `w` no terminal |

---

## 🧪 Verificação e Build

### Verificação TypeScript
```bash
npx tsc --noEmit
```

### Build de Produção (Android)
```bash
npx expo export --platform android
```

### Testes Unitários
```bash
npm test
```

---

## 📖 Documentação Técnica

| Documento | Descrição |
|---|---|
| [Arquitetura Frontend](./docs/Arquitetura%20Frontend.md) | Especificação técnica completa: estrutura de pastas, gerenciamento de estado, camada de serviços, navegação e padrões |
| [Enunciado](./docs/enunciado.md) | Requisitos do projeto e critérios de avaliação |

---

## 🔥 Conceitos Aplicados

### React Native
- Componentes funcionais com hooks
- FlatList virtualizada com ListHeaderComponent
- Skeleton Loading animado
- Platform-specific files (`.native.tsx` / `.web.tsx`)

### TypeScript
- Tipagem estrita em todas as camadas
- Interfaces compartilhadas (`Area`, `User`, `Alerta`)
- Navegação estritamente tipada (`namespace ReactNavigation`)
- Generics em queries e mutations

### Consumo de API
- Axios com interceptors (JWT automático + error logging)
- TanStack React Query (cache, invalidação, estados derivados)
- Service Layer desacoplada das screens

### Persistência Local
- AsyncStorage para sessão (token + user)
- AsyncStorage para preferências (tema, favoritos)
- Buffer de logs persistido entre sessões

### Navegação
- React Navigation v7 (Stack + Bottom Tabs)
- Tipagem global de rotas
- Parâmetros minimais (apenas IDs)

### UI/UX
- Dark Mode / Light Mode completo
- Design System com tokens de cor
- Skeleton Loading
- Micro-interações (badges, status colors)
- Modais de confirmação para ações destrutivas

---

## 📸 Evidências de Execução

> Os links abaixo demonstram o sistema funcionando em produção:

- 🔗 [API ativa em produção (Swagger UI)](https://carboneye-api.onrender.com/api/docs)
- 📱 [Backend (GitHub)](https://github.com/victordz-dev/CarbonEye-api)

---

## 📚 Referências

- [NASA — National Aeronautics and Space Administration](https://www.nasa.gov/)
- [ESA — European Space Agency](https://www.esa.int/)
- [OpenWeather API](https://openweathermap.org/)
- [AgroMonitoring API](https://agromonitoring.com/)
- [NASA FIRMS — Fire Information](https://firms.modaps.eosdis.nasa.gov/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [TanStack Query](https://tanstack.com/query)
