const {
  app, request, sequelize, setupDatabase, getToken, defaultUser,
} = require('./helpers');
const { User } = require('../src/models');

beforeEach(setupDatabase);
afterAll(() => sequelize.close());

describe('POST /v1/user', () => {
  it('cadastra um usuário e retorna 201 sem a senha', async () => {
    const res = await request(app).post('/v1/user').send(defaultUser);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: 1, firstname: 'Maria', surname: 'Silva', email: 'maria@mail.com',
    });
  });

  it('salva a senha como hash bcrypt, não em texto puro', async () => {
    await request(app).post('/v1/user').send(defaultUser);
    const user = await User.findByPk(1);

    expect(user.password).not.toBe('123@123');
    expect(user.password).toMatch(/^\$2[aby]\$/);
  });

  it('retorna 400 quando as senhas não conferem', async () => {
    const res = await request(app).post('/v1/user').send({ ...defaultUser, confirmPassword: 'outra' });
    expect(res.status).toBe(400);
  });

  it('retorna 400 quando faltam campos obrigatórios', async () => {
    const res = await request(app).post('/v1/user').send({ email: 'x@mail.com' });
    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  it('retorna 400 para e-mail já cadastrado', async () => {
    await request(app).post('/v1/user').send(defaultUser);
    const res = await request(app).post('/v1/user').send(defaultUser);
    expect(res.status).toBe(400);
  });
});

describe('GET /v1/user/:id', () => {
  it('retorna o usuário', async () => {
    await request(app).post('/v1/user').send(defaultUser);
    const res = await request(app).get('/v1/user/1');

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('maria@mail.com');
    expect(res.body.password).toBeUndefined();
  });

  it('retorna 404 para usuário inexistente', async () => {
    const res = await request(app).get('/v1/user/999');
    expect(res.status).toBe(404);
  });
});

describe('POST /v1/user/token', () => {
  it('gera um token com credenciais corretas', async () => {
    await request(app).post('/v1/user').send(defaultUser);
    const res = await request(app).post('/v1/user/token').send({ email: defaultUser.email, password: '123@123' });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
  });

  it('retorna 400 com senha errada', async () => {
    await request(app).post('/v1/user').send(defaultUser);
    const res = await request(app).post('/v1/user/token').send({ email: defaultUser.email, password: 'errada' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /v1/user/:id', () => {
  const changes = { firstname: 'Ana', surname: 'Souza', email: 'ana@mail.com' };

  it('atualiza o usuário e retorna 204', async () => {
    const token = await getToken();
    const res = await request(app).put('/v1/user/1').set('Authorization', `Bearer ${token}`).send(changes);

    expect(res.status).toBe(204);
    const updated = await request(app).get('/v1/user/1');
    expect(updated.body.firstname).toBe('Ana');
  });

  it('retorna 400 sem o cabeçalho Authorization', async () => {
    const res = await request(app).put('/v1/user/1').send(changes);
    expect(res.status).toBe(400);
  });

  it('retorna 401 com token inválido', async () => {
    const res = await request(app).put('/v1/user/1').set('Authorization', 'Bearer abc.def.ghi').send(changes);
    expect(res.status).toBe(401);
  });

  it('retorna 404 para usuário inexistente', async () => {
    const token = await getToken();
    const res = await request(app).put('/v1/user/999').set('Authorization', `Bearer ${token}`).send(changes);
    expect(res.status).toBe(404);
  });

  it('retorna 400 com dados inválidos', async () => {
    const token = await getToken();
    const res = await request(app).put('/v1/user/1').set('Authorization', `Bearer ${token}`).send({ email: 'x' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /v1/user/:id', () => {
  it('remove o usuário e retorna 204', async () => {
    const token = await getToken();
    const res = await request(app).delete('/v1/user/1').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect((await request(app).get('/v1/user/1')).status).toBe(404);
  });

  it('retorna 404 para usuário inexistente', async () => {
    const token = await getToken();
    const res = await request(app).delete('/v1/user/999').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
