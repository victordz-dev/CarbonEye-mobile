# 🛰️ CarbonEye - Frontend Mobile

O frontend do **CarbonEye** é um aplicativo mobile de alta fidelidade desenvolvido utilizando **Expo (React Native)** com **TypeScript** (configurado sob regras estritas de tipagem e livre de qualquer uso de `any`). A interface permite aos usuários mapear áreas ecológicas em tempo real, monitorar a saúde da vegetação por dados de satélite e consultar laudos de forma resiliente, mesmo Offline.

---

## 👥 Integrantes do Grupo
* **Nome do Integrante 1** - RM: XXXXX
* **Nome do Integrante 2** - RM: XXXXX
* **Nome do Integrante 3** - RM: XXXXX
* **Nome do Integrante 4** - RM: XXXXX
* **Nome do Integrante 5** - RM: XXXXX

---

## 📱 Funcionalidades da Interface
* **Fluxo de Autenticação Seguro:** Telas de Login e Cadastro baseadas em campos dinâmicos integrados com tokens JWT.
* **Painel Geral (Dashboard):** Tela Home com métricas-chave de saúde das propriedades monitoradas, feed de alertas meteorológicos/incêndios de risco e controle dinâmico da cota contratada de hectares.
* **Mapa de Desenho Cartográfico:** Permite delimitar polígonos sobre imagens de satélite. Conta com:
  * Restrições rígidas (limite de até 10 hectares e no máximo 50 vértices).
  * Integração da biblioteca **Turf.js** no cliente para validar autointerseções do desenho em tempo real.
  * Renderização nativa com `react-native-maps` em celulares e fallback dinâmico (Leaflet/Maps Embed) caso rodando em navegadores desktop (`Platform.OS === 'web'`).
* **Histórico Offline-First:** Lista inteligente de laudos salvos que são cacheados localmente através de persistência em disco do **TanStack Query** no `AsyncStorage`. Permite ver laudos salvos e detalhes sem conexão ativa com a internet.
* **Detalhes e Gráficos:** Tela de análise minuciosa da área com gráficos de linha interativos que acompanham a variação trimestral do índice NDVI.

---

## 🧱 Arquitetura de Pastas (Frontend)

```txt
src/
 ├── assets/         # Recursos estáticos locais (imagens, logos, PDFs explicativos)
 ├── components/     # Componentes de interface reutilizáveis (SiriBadge, Loading states, etc.)
 ├── contexts/       # Contextos globais (AuthContext para sessão, ThemeContext para visual)
 ├── hooks/          # Custom hooks que encapsulam lógica e estados (useAuth, useTheme)
 ├── navigation/     # Configuração de rotas de navegação (Bottom Tabs e Native Stack)
 ├── screens/        # Telas da aplicação (Login, Register, Home, Map, History, Details, Settings, Info)
 ├── services/       # Service layer para consumo de APIs externas (Axios, interceptors)
 ├── storage/        # Abstração de persistência local (AsyncStorage wrappers)
 ├── theme/          # Sistema de design tokens (definição de cores do Dark/Light mode)
 ├── types/          # Tipagem TypeScript estrita e interfaces compartilhadas
 └── utils/          # Funções utilitárias (cálculos matemáticos, filtros e helpers geo)
```

---

## 📦 Tecnologias e Bibliotecas de Destaque
* **Expo SDK 55 + TypeScript**
* **React Navigation v7** (`@react-navigation/native`, `@react-navigation/bottom-tabs` & `@react-navigation/native-stack`)
* **TanStack Query (React Query) v5** + **AsyncStorage** para sincronização robusta Offline-First
* **Turf.js** (`@turf/kinks` e `@turf/area`) para geometria matemática no celular
* **Axios** para consumo RESTful
* **Vanilla React Native Stylesheets** para consistência, temas dinâmicos (Dark/Light) e micro-animações customizadas

---

## 🔧 Configuração e Execução

### Pré-requisitos
1. **Node.js** (versão 18 ou superior).
2. Aplicativo **Expo Go** instalado em seu dispositivo móvel (disponível na App Store ou Google Play Store) OU emuladores configurados (Android Studio / Xcode).
3. Ter o **CarbonEye Backend** rodando localmente ou em produção para o app consumir a API.

### 1. Configurar URL do Backend
No arquivo `frontend/src/services/api.ts`, certifique-se de configurar a variável ou a string do `baseURL` para apontar para o seu backend.
* Se estiver testando no **navegador Web** ou **Emulador**: `http://localhost:3000`
* Se estiver testando em um **celular físico**: Use o endereço IP local da sua máquina (ex: `http://192.168.1.50:3000`).

### 2. Instalar Dependências
```bash
npm install
```

### 3. Executar o Servidor do Expo
```bash
npx expo start
```

### 4. Conectar seu Dispositivo
* **No Celular (Expo Go):** Abra a câmera do seu celular (iOS) ou o próprio app Expo Go (Android) e escaneie o código QR exibido no terminal.
* **No Emulador:** Pressione `a` para abrir no emulador Android ou `i` para emulador iOS.
* **No Navegador Web:** Pressione `w` no terminal para compilar e abrir a versão Web do CarbonEye.

---

## 🧪 Verificação TypeScript
Para rodar a validação estrita de tipos em todo o projeto, execute:
```bash
npx tsc --noEmit
```
O projeto deve compilar limpo e sem warnings.
