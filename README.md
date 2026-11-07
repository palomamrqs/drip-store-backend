# Drip Store — Back-end

API REST do e-commerce Drip Store, desenvolvida como projeto final de Back-end do curso **Desenvolvimento Web Fullstack — Geração Tech 4.0**.

Segue o escopo do [repositório oficial do projeto](https://github.com/digitalcollegebr/projeto-backend) e é consumida pelo front-end ([drip-store-frontend](https://github.com/palomamrqs/drip-store-frontend)).

**Equipe:** Paloma Marques Sousa

## Tecnologias

- **Node.js** + **Express** — servidor e rotas
- **MySQL** + **Sequelize** — banco de dados, models, migrations e seeders
- **JWT** (`jsonwebtoken`) — autenticação
- **bcrypt** — hash das senhas
- **Dotenv** — variáveis de ambiente
- **Swagger** — documentação interativa em `/docs`
- **Jest** + **Supertest** — testes automatizados
- **Nodemon** — recarregamento automático em desenvolvimento

## Como rodar

Pré-requisitos: [Node.js](https://nodejs.org/) 18+ e um servidor **MySQL** rodando (pode ser o do XAMPP, MySQL Workbench ou Docker).

```bash
# 1. Instalar as dependências
npm install

# 2. Criar o arquivo de configuração
cp .env.example .env
# edite DB_USER, DB_PASSWORD e JWT_SECRET no .env

# 3. Criar o banco, as tabelas e os dados de exemplo
npm run db:create
npm run db:migrate
npm run db:seed

# 4. Subir a API
npm run dev
```

- API: **http://localhost:3000/v1**
- Documentação (Swagger): **http://localhost:3000/docs**

Usuário criado pelo seeder: `admin@dripstore.com` / senha `123@123`.

> Quer subir um MySQL rapidinho com Docker?
> `docker run --name drip-mysql -e MYSQL_ROOT_PASSWORD=root -p 3306:3306 -d mysql:8`
> e use `DB_PASSWORD=root` no `.env`.

### Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe a API com nodemon |
| `npm start` | Sobe a API em modo produção |
| `npm run db:create` | Cria o banco definido em `DB_NAME` |
| `npm run db:migrate` | Executa as migrations (cria as tabelas) |
| `npm run db:seed` | Insere os dados de exemplo |
| `npm run db:reset` | Desfaz tudo e recria tabelas e dados |
| `npm test` | Roda os testes (usa SQLite em memória, não precisa de MySQL) |

## Estrutura de pastas

Padrão MVC com uma camada de *services* para as regras de negócio:

```
src/
├── config/          # Conexão com o banco (config.js e database.js)
├── controllers/     # Recebem a requisição e devolvem a resposta HTTP
├── database/
│   ├── migrations/  # Criação das 6 tabelas
│   └── seeders/     # Dados de exemplo
├── docs/            # swagger.yaml
├── middleware/      # auth.js (JWT) e errorHandler.js
├── models/          # Models do Sequelize e relacionamentos
├── routes/          # Rotas /v1
├── services/        # Regras de negócio e validações
├── utils/           # Erros HTTP, paginação, upload de imagens
├── app.js           # Configuração do Express
└── server.js        # Inicialização do servidor
tests/               # Testes de integração com Jest + Supertest
uploads/             # Imagens dos produtos
```

## Banco de dados

```
users                    categories               products
─────────────            ─────────────            ─────────────────────
id (PK)                  id (PK)                  id (PK)
firstname                name                     enabled
surname                  slug                     name, slug
email (único)            use_in_menu              use_in_menu
password (hash)          created_at               stock, description
created_at               updated_at               price, price_with_discount
updated_at                                        created_at, updated_at
                                                          │
          ┌───────────────────────┬───────────────────────┼──────────────────┐
          │ 1:N                   │ 1:N                   │ N:N              │
product_images            product_options          product_categories      │
─────────────             ─────────────            ─────────────────       │
id (PK)                   id (PK)                  product_id (PK, FK) ────┘
product_id (FK)           product_id (FK)          category_id (PK, FK) → categories
enabled                   title
path                      shape (square|circle)
                          radius
                          type (text|color)
                          values ("P,M,G")
```

As chaves estrangeiras usam `ON DELETE CASCADE`: ao apagar um produto, suas imagens, opções e vínculos com categorias também são removidos.

## Endpoints

| Método | Rota | Token? | Descrição |
| --- | --- | :---: | --- |
| POST | `/v1/user/token` | | Gera o token JWT |
| POST | `/v1/user` | | Cadastra usuário |
| GET | `/v1/user/:id` | | Busca usuário |
| PUT | `/v1/user/:id` | ✔ | Atualiza usuário |
| DELETE | `/v1/user/:id` | ✔ | Remove usuário |
| GET | `/v1/category/search` | | Lista categorias (`limit`, `page`, `fields`, `use_in_menu`) |
| GET | `/v1/category/:id` | | Busca categoria |
| POST | `/v1/category` | ✔ | Cadastra categoria |
| PUT | `/v1/category/:id` | ✔ | Atualiza categoria |
| DELETE | `/v1/category/:id` | ✔ | Remove categoria |
| GET | `/v1/product/search` | | Lista produtos (`limit`, `page`, `fields`, `match`, `category_ids`, `price-range`, `option[id]`) |
| GET | `/v1/product/:id` | | Busca produto |
| POST | `/v1/product` | ✔ | Cadastra produto (imagens em base64) |
| PUT | `/v1/product/:id` | ✔ | Atualiza produto, imagens e opções |
| DELETE | `/v1/product/:id` | ✔ | Remove produto |

Detalhes de cada payload e resposta estão no Swagger (`/docs`).

### Autenticação

```bash
# 1. Gerar o token
curl -X POST http://localhost:3000/v1/user/token \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@dripstore.com", "password": "123@123"}'

# 2. Usar o token nas rotas protegidas
curl -X POST http://localhost:3000/v1/category \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Infantil", "slug": "infantil", "use_in_menu": true}'
```

### Exemplos de busca

```
GET /v1/product/search?limit=-1                    # todos os produtos
GET /v1/product/search?limit=4&page=2              # paginação
GET /v1/product/search?match=Nike                  # nome ou descrição
GET /v1/product/search?category_ids=1,3            # por categorias
GET /v1/product/search?price-range=100-300         # faixa de preço
GET /v1/product/search?option[1]=40,41             # por valor de opção
GET /v1/product/search?fields=name,price,images    # só alguns campos
```

## Códigos de resposta

| Código | Quando |
| --- | --- |
| 200 | Consulta bem-sucedida |
| 201 | Recurso criado |
| 204 | Atualização ou remoção bem-sucedida (sem corpo) |
| 400 | Dados inválidos, ou cabeçalho `Authorization` ausente (Seção 05 — Requisito 02) |
| 401 | Token inválido ou expirado |
| 404 | Recurso não encontrado |

**Decisões tomadas onde a documentação deixa margem:**

- `POST /v1/user` e `POST /v1/user/token` são públicos; sem isso ninguém conseguiria criar a primeira conta nem fazer login.
- Nas opções do produto, aceitamos tanto `values` quanto `value` (o exemplo da documentação usa os dois), e `radius` pode vir como `"4px"` ou `4`.
- Criação e atualização de produto rodam dentro de uma **transação**: se qualquer parte falhar, nada é salvo.

## Testes

```bash
npm test
```

São **57 testes** de integração cobrindo todos os endpoints, status codes, filtros de busca, autenticação, hash de senha, upload de imagens e rollback da transação. O banco de testes é um SQLite em memória criado pelas **mesmas migrations** do MySQL.
