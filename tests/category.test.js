const {
  app, request, sequelize, setupDatabase, getToken,
} = require('./helpers');

let token;

beforeEach(async () => {
  await setupDatabase();
  token = await getToken();
});
afterAll(() => sequelize.close());

const auth = () => ({ Authorization: `Bearer ${token}` });

async function createCategories() {
  const items = [
    { name: 'Shoes', slug: 'shoes', use_in_menu: true },
    { name: 'Offers', slug: 'offers', use_in_menu: true },
    { name: 'Black Friday', slug: 'black-friday', use_in_menu: false },
  ];
  for (const item of items) {
    // eslint-disable-next-line no-await-in-loop
    await request(app).post('/v1/category').set(auth()).send(item);
  }
}

describe('POST /v1/category', () => {
  it('cria uma categoria e retorna 201', async () => {
    const res = await request(app).post('/v1/category').set(auth())
      .send({ name: 'Shoes', slug: 'shoes', use_in_menu: true });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: 1, name: 'Shoes', slug: 'shoes', use_in_menu: true,
    });
  });

  it('usa use_in_menu = false por padrão', async () => {
    const res = await request(app).post('/v1/category').set(auth()).send({ name: 'A', slug: 'a' });
    expect(res.body.use_in_menu).toBe(false);
  });

  it('retorna 400 sem nome', async () => {
    const res = await request(app).post('/v1/category').set(auth()).send({ slug: 'a' });
    expect(res.status).toBe(400);
  });

  it('retorna 400 sem token', async () => {
    const res = await request(app).post('/v1/category').send({ name: 'A', slug: 'a' });
    expect(res.status).toBe(400);
  });
});

describe('GET /v1/category/search', () => {
  beforeEach(createCategories);

  it('lista com paginação padrão', async () => {
    const res = await request(app).get('/v1/category/search');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 3, limit: 12, page: 1 });
    expect(res.body.data).toHaveLength(3);
  });

  it('respeita limit e page', async () => {
    const res = await request(app).get('/v1/category/search?limit=2&page=2');

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].slug).toBe('black-friday');
  });

  it('limit=-1 traz todos os itens', async () => {
    const res = await request(app).get('/v1/category/search?limit=-1');
    expect(res.body.data).toHaveLength(3);
    expect(res.body.limit).toBe(-1);
  });

  it('filtra por use_in_menu', async () => {
    const res = await request(app).get('/v1/category/search?use_in_menu=true');
    expect(res.body.total).toBe(2);
  });

  it('limita os campos com fields', async () => {
    const res = await request(app).get('/v1/category/search?fields=name');
    expect(Object.keys(res.body.data[0]).sort()).toEqual(['id', 'name']);
  });

  it('retorna 400 com limit inválido', async () => {
    const res = await request(app).get('/v1/category/search?limit=abc');
    expect(res.status).toBe(400);
  });
});

describe('GET/PUT/DELETE /v1/category/:id', () => {
  beforeEach(createCategories);

  it('busca pelo ID', async () => {
    const res = await request(app).get('/v1/category/2');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Offers');
  });

  it('retorna 404 para ID inexistente', async () => {
    expect((await request(app).get('/v1/category/99')).status).toBe(404);
  });

  it('atualiza e retorna 204', async () => {
    const res = await request(app).put('/v1/category/1').set(auth())
      .send({ name: 'Tênis', slug: 'tenis', use_in_menu: false });

    expect(res.status).toBe(204);
    const updated = await request(app).get('/v1/category/1');
    expect(updated.body).toMatchObject({ name: 'Tênis', use_in_menu: false });
  });

  it('PUT retorna 404 para ID inexistente', async () => {
    const res = await request(app).put('/v1/category/99').set(auth()).send({ name: 'A', slug: 'a' });
    expect(res.status).toBe(404);
  });

  it('remove e retorna 204', async () => {
    const res = await request(app).delete('/v1/category/1').set(auth());
    expect(res.status).toBe(204);
    expect((await request(app).get('/v1/category/1')).status).toBe(404);
  });

  it('DELETE retorna 401 com token inválido', async () => {
    const res = await request(app).delete('/v1/category/1').set('Authorization', 'Bearer x');
    expect(res.status).toBe(401);
  });
});
