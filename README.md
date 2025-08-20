# 🗺️ Jogo Geo - Geoconquista Multijogador

Um jogo web de geoconquista multijogador em tempo real onde jogadores disputam territórios reais usando GPS.

## 🎯 Conceito

- **3 Equipes**: Verde, Azul e Vermelha
- **Conquista Territorial**: Jogadores percorrem o mundo real e "riscam" territórios no mapa
- **Tempo Real**: Todas as conquistas são sincronizadas instantaneamente
- **Sistema de Pontuação**: Baseado na área conquistada + quizzes
- **Proteção Anti-Cheat**: Validação de velocidade e movimento

## 🚀 Funcionalidades

### ✅ Implementadas
- [x] Autenticação com Supabase
- [x] Escolha de equipe (Verde/Azul/Vermelho)
- [x] Rastreamento GPS em tempo real
- [x] Desenho de territórios no mapa
- [x] Cálculo automático de área
- [x] Sistema de pontuação
- [x] Leaderboard em tempo real
- [x] Visualização de outros jogadores
- [x] Quizzes após conquistas
- [x] Validação de movimento (anti-cheat)
- [x] Interface responsiva

### 🔄 Em Desenvolvimento
- [ ] Batalhas entre equipes
- [ ] Sistema de energia
- [ ] Eventos especiais
- [ ] Notificações push

## 🛠️ Stack Tecnológica

- **Frontend**: React + TypeScript + Vite
- **Mapas**: Leaflet + react-leaflet
- **Geometria**: Turf.js
- **Estado**: Zustand
- **Backend**: Supabase (Auth + DB + Realtime)
- **Estilização**: Tailwind CSS
- **Roteamento**: React Router

## 📋 Pré-requisitos

- Node.js 18+
- Conta no Supabase
- Navegador com suporte a GPS

## ⚙️ Setup

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd jogo-geo
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o Supabase

#### 3.1 Crie um projeto no Supabase
- Acesse [supabase.com](https://supabase.com)
- Crie um novo projeto
- Anote a URL e a chave anônima

#### 3.2 Configure as variáveis de ambiente
Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

#### 3.3 Execute o SQL para criar as tabelas
No SQL Editor do Supabase, execute o arquivo `database-setup-safe.sql`:

```sql
-- Use o arquivo database-setup-safe.sql que verifica se as tabelas existem
-- antes de criá-las, evitando erros de "relation already exists"
```

### 4. Execute o projeto
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:5173`

## 🎮 Como Jogar

### 1. Criação de Conta
- Acesse o jogo
- Clique em "Criar Conta"
- Escolha sua equipe (Verde, Azul ou Vermelho)
- Confirme o email

### 2. Iniciar Jogo
- Faça login
- Clique em "Iniciar GPS" para usar sua posição real

### 3. Conquistar Territórios
- Clique em "Iniciar Rastreamento"
- Mova-se pelo mundo real
- Feche o perímetro retornando ao ponto inicial
- O território será automaticamente conquistado

### 4. Sistema de Pontuação
- **Área**: Pontos = km² conquistados (área exata)
- **Quiz**: +10 pontos por resposta correta
- **Equipe**: Pontos somam ao total da equipe

### 5. Leaderboard
- Acesse o leaderboard para ver rankings
- Visualize pontuação individual e por equipe
- Veja jogadores online

## 🔧 Desenvolvimento

### Estrutura de Pastas
```
src/
├── components/     # Componentes React
├── hooks/         # Custom hooks
├── lib/           # Utilitários e configurações
├── pages/         # Páginas da aplicação
├── store/         # Estado global (Zustand)
├── styles/        # Estilos CSS
└── types/         # Definições TypeScript
```

### Scripts Disponíveis
```bash
npm run dev        # Desenvolvimento
npm run build      # Build para produção
npm run preview    # Preview do build
npm run lint       # Linting
```

### Hooks Principais
- `useAuth`: Autenticação e perfil do usuário
- `useGeo`: Geolocalização e validação de movimento
- `useRealtime`: Sincronização em tempo real
- `useTrace`: Rastreamento de territórios

## 🛡️ Segurança

### Validação de Movimento
- Velocidade máxima: 30 km/h
- Logging de movimentos suspeitos
- Validação de precisão GPS

### Autenticação
- Supabase Auth com email/senha
- Sessões seguras
- Políticas RLS no banco

## 📱 Responsividade

O jogo é totalmente responsivo e funciona em:
- Desktop (mouse + teclado)
- Tablet (touch + GPS)
- Mobile (touch + GPS)

## 🚀 Deploy

### Vercel (Recomendado)
```bash
npm run build
vercel --prod
```

### Outras Plataformas
- Netlify
- GitHub Pages
- Qualquer servidor estático

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

- **Issues**: Use o GitHub Issues
- **Documentação**: Consulte este README
- **Comunidade**: Entre em contato via GitHub

## 🎯 Roadmap

### Versão 1.1
- [ ] Batalhas entre equipes
- [ ] Sistema de energia diária
- [ ] Notificações push

### Versão 1.2
- [ ] Eventos semanais
- [ ] Sistema de conquistas
- [ ] Chat entre equipes

### Versão 2.0
- [ ] NFTs para territórios raros
- [ ] Itens colecionáveis
- [ ] Modo competitivo

---

**Desenvolvido com ❤️ para a comunidade de jogos geográficos**

