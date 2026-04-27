# CORREÇÃO CRÍTICA — Banco de Dados
## Projeto: Eu Não Aceito Maus Tratos

---

## O QUE ACONTECEU

Este projeto foi inicialmente criado usando a mesma DATABASE_URL do projeto
Participa Cidade — ambos apontavam para o mesmo banco PostgreSQL no Railway.

Isso causou mistura de dados entre os dois projetos:
- Usuários dos dois sistemas na mesma tabela
- Risco de um projeto apagar dados do outro
- Ausência de isolamento e independência entre sistemas

---

## CORREÇÃO APLICADA — Abril 2026

Foi criado um novo serviço PostgreSQL exclusivo no Railway para este projeto.
Os dois projetos agora têm bancos completamente independentes.

---

## BANCO DE DADOS EXCLUSIVO — Causa Animal

```
Host:     metro.proxy.rlwy.net
Porta:    15852
Database: railway
```

### String de conexão completa:
```
DATABASE_URL=postgresql://postgres:SENHA@metro.proxy.rlwy.net:15852/railway
```

> ⚠️ Substitua SENHA pela senha gerada pelo Railway.
> Para ver a string completa acesse:
> Railway → projeto scintillating-encouragement → PostgreSQL → Connect

---

## RAILWAY PROJECT

- **Nome do projeto:** scintillating-encouragement
- **Serviço PostgreSQL:** criado exclusivamente para este projeto
- **URL de acesso:** https://railway.app/project/scintillating-encouragement

---

## ARQUIVO backend/.env CORRETO

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:SENHA@metro.proxy.rlwy.net:15852/railway
JWT_SECRET=causaanimal_secret_key_2024
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=dryxpjbac
CLOUDINARY_API_KEY=676685561816853
CLOUDINARY_API_SECRET=gnmVQDSndZNI7CI4dvR8sE-kMgw
TWILIO_ACCOUNT_SID=AC47138c6317bc7d464be39a96b029bf4f
TWILIO_AUTH_TOKEN=00b20e3e896ae70096a1c929e77d6330
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
FRONTEND_URL=http://localhost:3002
```

---

## REGRA ABSOLUTA

⚠️ Este projeto NUNCA deve usar a DATABASE_URL do Participa Cidade:
```
NÃO USAR: mainline.proxy.rlwy.net:38266
USAR SEMPRE: metro.proxy.rlwy.net:15852
```

---

## PENDÊNCIAS

- [ ] Rodar migrations para criar as tabelas no novo banco
- [ ] Criar usuário admin do Causa Animal
- [ ] Fazer deploy do backend para reconectar ao novo banco
- [ ] Confirmar que nenhum dado do Participa Cidade está neste banco
