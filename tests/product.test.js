const {
  app, request, sequelize, setupDatabase, getToken, PNG_BASE64,
} = require('./helpers');

let token;
const auth = () => ({ Authorization: `Bearer ${token}` });

const baseProduct = {
  enabled: true,
  name: 'Tênis Nike Revolution',
  slug: 'tenis-nike-revolution',
  stock: 10,
  description: 'Tênis de corrida leve',
  price: 199.9,
  price_with_discount: 149.9,
  category_ids: [1],
  images: [{ type: 'image/png', content: PNG_BASE64 }],
  options: [
    {
      title: 'Tamanho', shape: 'square', radius: '4px', type: 'text', values: ['40', '41', '42'],
    },
    {
      title: 'Cor', shape: 'circle', type: 'color', values: ['#000', '#333'],
    },
  ],
};

beforeEach(async () => {
  await setupDatabase();
  token = await getToken();
  await request(app).post('/v1/category').set(auth()).send({ name: 'Tênis', slug: 'tenis' });
  await request(app).post('/v1/category').set(auth()).send({ name: 'Ofertas', slug: 'ofertas' });
});
afterAll(() => sequelize.close());

describe('POST /v1/product', () => {
  it('cria produto com imagens, opções e categorias', async () => {
    const res = await request(app).post('/v1/product').set(auth()).send(baseProduct);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: 1, name: 'Tênis Nike Revolution', price: 199.9, category_ids: [1],
    });
    expect(res.body.images).toHaveLength(1);
    expect(res.body.images[0].content).toMatch(/\/uploads\/products\/.+\.png$/);
    expect(res.body.options[0]).toMatchObject({
      title: 'Tamanho', shape: 'square', radius: 4, type: 'text', values: ['40', '41', '42'],
    });
  });

  it('a imagem salva fica acessível pela URL retornada', async () => {
    const res = await request(app).post('/v1/product').set(auth()).send(baseProduct);
    const url = new URL(res.body.images[0].content);
    const file = await request(app).get(url.pathname);

    expect(file.status).toBe(200);
    expect(file.headers['content-type']).toBe('image/png');
  });

  it('aceita "value" no lugar de "values" nas opções (como no exemplo da documentação)', async () => {
    const res = await request(app).post('/v1/product').set(auth()).send({
      ...baseProduct, options: [{ title: 'Tamanho', value: ['P', 'M'] }],
    });
    expect(res.status).toBe(201);
    expect(res.body.options[0].values).toEqual(['P', 'M']);
  });

  it('retorna 400 sem campos obrigatórios', async () => {
    const res = await request(app).post('/v1/product').set(auth()).send({ name: 'X' });
    expect(res.status).toBe(400);
  });

  it('retorna 400 para categoria inexistente', async () => {
    const res = await request(app).post('/v1/product').set(auth()).send({ ...baseProduct, category_ids: [99] });
    expect(res.status).toBe(400);
  });

  it('retorna 400 para shape inválido', async () => {
    const res = await request(app).post('/v1/product').set(auth()).send({
      ...baseProduct, options: [{ title: 'X', shape: 'triangle', values: ['a'] }],
    });
    expect(res.status).toBe(400);
  });

  it('retorna 400 sem token', async () => {
    const res = await request(app).post('/v1/product').send(baseProduct);
    expect(res.status).toBe(400);
  });
});

describe('GET /v1/product/search', () => {
  beforeEach(async () => {
    await request(app).post('/v1/product').set(auth()).send(baseProduct);
    await request(app).post('/v1/product').set(auth()).send({
      ...baseProduct,
      name: 'Camiseta Básica',
      slug: 'camiseta-basica',
      description: 'Algodão',
      price: 59.9,
      category_ids: [2],
      options: [{ title: 'Tamanho', values: ['P', 'M', 'G'] }],
    });
    await request(app).post('/v1/product').set(auth()).send({
      ...baseProduct, name: 'Tênis Adidas', slug: 'tenis-adidas', price: 350, category_ids: [1, 2],
    });
  });

  it('lista todos os produtos', async () => {
    const res = await request(app).get('/v1/product/search');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 3, limit: 12, page: 1 });
  });

  it('pagina corretamente', async () => {
    const res = await request(app).get('/v1/product/search?limit=2&page=2');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.total).toBe(3);
  });

  it('filtra por match no nome ou descrição', async () => {
    const byName = await request(app).get('/v1/product/search?match=Camiseta');
    const byDescription = await request(app).get('/v1/product/search?match=Algod');
    expect(byName.body.total).toBe(1);
    expect(byDescription.body.data[0].slug).toBe('camiseta-basica');
  });

  it('filtra por category_ids', async () => {
    const res = await request(app).get('/v1/product/search?category_ids=2');
    expect(res.body.data.map((p) => p.id)).toEqual([2, 3]);
  });

  it('filtra por price-range', async () => {
    const res = await request(app).get('/v1/product/search?price-range=100-300');
    expect(res.body.data.map((p) => p.id)).toEqual([1]);
  });

  it('filtra por option[id]=valores', async () => {
    // A opção 3 é o "Tamanho" da camiseta (P, M, G)
    const res = await request(app).get('/v1/product/search?option[3]=G,GG');
    expect(res.body.data.map((p) => p.id)).toEqual([2]);
  });

  it('limita os campos com fields', async () => {
    const res = await request(app).get('/v1/product/search?fields=name,price');
    expect(Object.keys(res.body.data[0]).sort()).toEqual(['id', 'name', 'price']);
  });

  it('retorna 400 com price-range inválido', async () => {
    const res = await request(app).get('/v1/product/search?price-range=abc');
    expect(res.status).toBe(400);
  });

  it('retorna 400 com campo inexistente em fields', async () => {
    const res = await request(app).get('/v1/product/search?fields=senha');
    expect(res.status).toBe(400);
  });
});

describe('GET /v1/product/:id', () => {
  it('retorna o produto completo', async () => {
    await request(app).post('/v1/product').set(auth()).send(baseProduct);
    const res = await request(app).get('/v1/product/1');

    expect(res.status).toBe(200);
    expect(res.body.options).toHaveLength(2);
  });

  it('retorna 404 para ID inexistente', async () => {
    expect((await request(app).get('/v1/product/99')).status).toBe(404);
  });
});

describe('PUT /v1/product/:id', () => {
  beforeEach(async () => {
    await request(app).post('/v1/product').set(auth()).send(baseProduct);
  });

  it('atualiza dados, imagens, opções e categorias', async () => {
    const res = await request(app).put('/v1/product/1').set(auth()).send({
      name: 'Produto atualizado',
      price: 49.9,
      category_ids: [2],
      images: [
        { id: 1, deleted: true },
        { type: 'image/png', content: PNG_BASE64 },
      ],
      options: [
        { id: 1, deleted: true },
        { id: 2, radius: '10px', values: ['#fff'] },
        { title: 'Material', values: ['100% algodão', '65% algodão'] },
      ],
    });
    expect(res.status).toBe(204);

    const product = (await request(app).get('/v1/product/1')).body;
    expect(product).toMatchObject({ name: 'Produto atualizado', price: 49.9, category_ids: [2] });
    expect(product.images.map((i) => i.id)).toEqual([2]);
    expect(product.options).toHaveLength(2);
    expect(product.options[0]).toMatchObject({ id: 2, radius: 10, values: ['#fff'] });
    expect(product.options[1].title).toBe('Material');
  });

  it('retorna 400 ao referenciar imagem de outro produto', async () => {
    const res = await request(app).put('/v1/product/1').set(auth()).send({ images: [{ id: 999, deleted: true }] });
    expect(res.status).toBe(400);
  });

  it('não altera nada se a atualização falhar no meio (transação)', async () => {
    await request(app).put('/v1/product/1').set(auth()).send({
      name: 'Não deve salvar',
      options: [{ id: 999, deleted: true }],
    });
    const product = (await request(app).get('/v1/product/1')).body;
    expect(product.name).toBe('Tênis Nike Revolution');
  });

  it('retorna 404 para ID inexistente', async () => {
    const res = await request(app).put('/v1/product/99').set(auth()).send({ name: 'X' });
    expect(res.status).toBe(404);
  });

  it('retorna 401 com token inválido', async () => {
    const res = await request(app).put('/v1/product/1').set('Authorization', 'Bearer x').send({ name: 'X' });
    expect(res.status).toBe(401);
  });
});

describe('DELETE /v1/product/:id', () => {
  it('remove o produto e retorna 204', async () => {
    await request(app).post('/v1/product').set(auth()).send(baseProduct);
    const res = await request(app).delete('/v1/product/1').set(auth());

    expect(res.status).toBe(204);
    expect((await request(app).get('/v1/product/1')).status).toBe(404);
  });

  it('retorna 404 para ID inexistente', async () => {
    const res = await request(app).delete('/v1/product/99').set(auth());
    expect(res.status).toBe(404);
  });
});
