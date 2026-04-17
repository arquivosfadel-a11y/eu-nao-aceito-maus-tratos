# Participa Cidade — CLAUDE.md

## Visão Geral
Plataforma cívica que conecta cidadãos às prefeituras. Cidadãos registram reclamações via app mobile, secretarias atendem, prefeito monitora via dashboard analítico.

## Estrutura do Projeto
```
participacidade/
├── backend/        — API Node.js/Express + Sequelize + PostgreSQL
├── web-admin/      — Next.js 16 (painel prefeito/secretário/validador)
└── mobile/         — React Native + Expo SDK 54 (app cidadão iOS/Android)
```

## Credenciais e Acessos

### Railway (backend + banco)
- URL produção: `https://participa-cidade-production.up.railway.app`
- PostgreSQL: `postgresql://postgres:zUDDVitqJpJGqEVJDILnjfFEdjaJNcSi@mainline.proxy.rlwy.net:38266/railway`

### Login web-admin
- Admin: `admin@participacidade.com.br` / `Teste123`
- Prefeito: `prefeito@taquarituba.sp.gov.br` / `Teste123`

### Cloudinary (imagens)
- Cloud: `dryxpjbac`
- API Key: `676685561816853`
- API Secret: `gnmVQDSndZNI7CI4dvR8sE-kMgw`

### Twilio (WhatsApp)
- SID: `AC47138c6317bc7d464be39a96b029bf4f`
- Token: `00b20e3e896ae70096a1c929e77d6330`
- From: `whatsapp:+14155238886`

### ngrok
- Authtoken: `3BOgXqpiyS11CM8a3NQP7JELI2G_4HFsNHj9dDQSD2oAkEAdV`

### Google Maps
- API Key: `AIzaSyCUU8K8w6DzN6fMjvs30bpzXR9pmNjScu4`

## Como Rodar (Mac)

### Backend
```bash
cd ~/softwares/participacidade/backend
npm run dev
# Roda na porta 3000 — conecta ao Railway PostgreSQL
```

### Web-admin
```bash
cd ~/softwares/participacidade/web-admin
npm run dev
# Roda na porta 3002 — acesse http://localhost:3002
```

### Mobile
```bash
# Numa aba separada — manter o ngrok rodando
ngrok http 8082

# Em outra aba
cd ~/softwares/participacidade/mobile
npx expo start --tunnel
```

## Arquivos .env

### backend/.env
```
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:zUDDVitqJpJGqEVJDILnjfFEdjaJNcSi@mainline.proxy.rlwy.net:38266/railway
JWT_SECRET=participa_cidade_secret_key_2024
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=dryxpjbac
CLOUDINARY_API_KEY=676685561816853
CLOUDINARY_API_SECRET=gnmVQDSndZNI7CI4dvR8sE-kMgw
TWILIO_ACCOUNT_SID=AC47138c6317bc7d464be39a96b029bf4f
TWILIO_AUTH_TOKEN=00b20e3e896ae70096a1c929e77d6330
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
FRONTEND_URL=http://localhost:3002
```

### web-admin/.env.local
```
NEXT_PUBLIC_API_URL=https://participa-cidade-production.up.railway.app/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCUU8K8w6DzN6fMjvs30bpzXR9pmNjScu4
```

### mobile/.env
```
API_URL=https://participa-cidade-production.up.railway.app/api
```

## Deploy (Railway)
```bash
cd ~/softwares/participacidade
git add .
git commit -m "descrição"
git push origin main
# Railway faz deploy automático em 2-3 minutos
```

## Regras de Negócio

### Status das Reclamações (fluxo)
```
pending → validated → in_progress → resolved → closed
                                             ↘ not_resolved
```
- `pending` — recém criada pelo cidadão, aguarda validação
- `validated` — aprovada pelo validador, encaminhada à secretaria
- `in_progress` — secretaria está atendendo
- `resolved` — secretaria marcou como resolvida
- `closed` — cidadão confirmou resolução ✅
- `not_resolved` — cidadão contestou
- `rejected` — validador rejeitou

### Regras do Dashboard do Prefeito
- **Nunca mostrar** `pending` nem `rejected`
- **Card Resolvidas** = `resolved` + `closed` (sempre somar os dois)
- **Total** = exclui `pending` e `rejected`
- **Taxa de resolução** = (resolved + closed) / total × 100

### Avaliação de Satisfação
- Cidadão avalia após status `resolved` ou `closed`
- Escala 1-5 com emojis: 😡😞😐😊😍
- Rota: `POST /cities/:id/rate`
- Tabela: `complaint_ratings`
- Usa `Complaint.sequelize.query()` — NÃO usar `sequelize` isolado

## Estrutura de Roles
| Role | Acesso |
|---|---|
| `citizen` | App mobile — cria e acompanha reclamações |
| `validator` | Valida/rejeita reclamações pendentes |
| `secretary` | Atende reclamações da sua secretaria |
| `mayor` | Dashboard analítico completo da cidade |
| `admin` | Acesso total ao sistema |

## Web-admin — Rotas do Prefeito
| Rota | Descrição |
|---|---|
| `/prefeito` | Dashboard com cards + desempenho secretarias |
| `/prefeito/mapa` | Mapa com reclamações georreferenciadas |
| `/prefeito/analitico` | Gráficos, mapa de calor, satisfação cidadã |
| `/prefeito/secretarias` | Split view — cards + reclamações por secretaria |
| `/prefeito/reclamacoes` | Lista completa de reclamações |

## Funcionalidades Implementadas

### Mobile (cidadão)
- Cadastro com verificação de telefone via SMS (Twilio)
- Registro de reclamações com fotos (Cloudinary) e GPS
- Acompanhamento de status em tempo real
- Chat com a secretaria
- Avaliação de satisfação após resolução (emojis 1-5)
- Push notifications (Expo)
- Tela "Minhas Reclamações" com filtros por status

### Web-admin (prefeito)
- Dashboard com KPIs: total, aguardando, andamento, resolvidas, taxa
- Desempenho por secretaria em 3 colunas com barra de progresso gradiente
- Dashboard analítico: gráfico mensal (Jan→Dez) com filtro de ano
- Mapa de calor com Leaflet + OpenStreetMap (mapa real da cidade)
- Modal expandido ao clicar no mapa
- Índice de satisfação cidadã com estrelas e barras por nota
- Secretarias: split view com cards ordenados por % resolução
- Reclamações filtradas ao clicar na secretaria

### Backend
- API REST completa
- Autenticação JWT
- Upload de imagens via Cloudinary
- Notificações WhatsApp via Twilio
- Socket.io para chat em tempo real
- Jobs automáticos: fechamento após 30 dias, prazo de confirmação 5 dias
- Rota analytics: `/cities/:id/analytics`
- Rota dashboard: `/cities/:id/dashboard`
- Avaliações: `/cities/:id/rate`
- Ranking público de cidades: `/cities/ranking`

## Bugs Conhecidos / Resolvidos
- `complaint_ratings` — usar `Complaint.sequelize.query()` não `sequelize` isolado
- Status `closed` exibir como "Encerrada" (não "Pendente") no mobile
- Card "Resolvidas" sempre somar `resolved + closed`
- Mapa de calor usa Leaflet com halos radiais (não canvas puro)
- Secretarias ordenadas por taxa de resolução decrescente

## Diferencial Licitatório
> "O sistema deve possuir dashboard analítico com mapa de calor geográfico por região, indicadores de desempenho por departamento e índice de satisfação cidadã com avaliação direta pelo usuário após resolução de cada ocorrência."

✅ Todos implementados.
