'use strict';

// Seeder com dados de exemplo: um usuário, categorias e produtos com imagens e opções.
// Usuário de teste: admin@dripstore.com / 123@123
const bcrypt = require('bcrypt');

const now = new Date();

const products = [
  { name: 'K-Swiss V8 - Masculino', price: 200, discount: 100, img: 1, cats: [1, 2] },
  { name: 'K-Swiss Court Classic', price: 249.9, discount: 179.9, img: 2, cats: [1, 4] },
  { name: 'Nike Revolution 6', price: 299.9, discount: 299.9, img: 3, cats: [1, 5] },
  { name: 'Adidas Runfalcon 3.0', price: 349.9, discount: 279.9, img: 4, cats: [1, 2, 5] },
  { name: 'Puma Smash V2', price: 199.9, discount: 199.9, img: 5, cats: [1] },
  { name: 'Nike Court Vision Low', price: 399.9, discount: 319.9, img: 1, cats: [1, 3] },
  { name: 'Adidas Grand Court', price: 329.9, discount: 329.9, img: 2, cats: [1, 4] },
  { name: 'Mizuno Wave Prophecy', price: 899.9, discount: 749.9, img: 3, cats: [1, 3, 5] },
  { name: 'Olympikus Corre 3', price: 499.9, discount: 449.9, img: 4, cats: [1, 5] },
  { name: 'Fila Float Maxxi', price: 459.9, discount: 459.9, img: 5, cats: [1, 2] },
  { name: 'Asics Gel-Nimbus 25', price: 1099.9, discount: 899.9, img: 1, cats: [1, 3, 5] },
  { name: 'New Balance 574', price: 699.9, discount: 699.9, img: 2, cats: [1, 4] },
];

const slugify = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('users', [{
      firstname: 'Admin',
      surname: 'Drip Store',
      email: 'admin@dripstore.com',
      password: await bcrypt.hash('123@123', 10),
      created_at: now,
      updated_at: now,
    }]);

    await queryInterface.bulkInsert('categories', [
      { id: 1, name: 'Tênis', slug: 'tenis', use_in_menu: true, created_at: now, updated_at: now },
      { id: 2, name: 'Ofertas', slug: 'ofertas', use_in_menu: true, created_at: now, updated_at: now },
      { id: 3, name: 'Lançamentos', slug: 'lancamentos', use_in_menu: true, created_at: now, updated_at: now },
      { id: 4, name: 'Casual', slug: 'casual', use_in_menu: false, created_at: now, updated_at: now },
      { id: 5, name: 'Esporte', slug: 'esporte', use_in_menu: false, created_at: now, updated_at: now },
    ]);

    await queryInterface.bulkInsert('products', products.map((p, i) => ({
      id: i + 1,
      enabled: true,
      name: p.name,
      slug: slugify(p.name),
      use_in_menu: false,
      stock: 10 + i,
      description: 'Tênis confortável para o dia a dia, com cabedal respirável e solado de borracha antiderrapante.',
      price: p.price,
      price_with_discount: p.discount,
      created_at: now,
      updated_at: now,
    })));

    // Cada produto recebe a miniatura + as 5 imagens da galeria
    const images = [];
    products.forEach((p, i) => {
      images.push({ product_id: i + 1, enabled: true, path: `uploads/products/product-thumb-${p.img}.jpeg` });
      for (let n = 1; n <= 5; n += 1) {
        images.push({ product_id: i + 1, enabled: true, path: `uploads/products/produc-image-${n}.jpeg` });
      }
    });
    await queryInterface.bulkInsert('product_images', images);

    const options = [];
    products.forEach((p, i) => {
      options.push({
        product_id: i + 1, title: 'Tamanho', shape: 'square', radius: 4, type: 'text', values: '39,40,41,42,43',
      });
      options.push({
        product_id: i + 1, title: 'Cor', shape: 'circle', radius: 0, type: 'color', values: '#6FEEFF,#FF6969,#5E5E5E,#6D70B7',
      });
    });
    await queryInterface.bulkInsert('product_options', options);

    const links = [];
    products.forEach((p, i) => p.cats.forEach((c) => links.push({ product_id: i + 1, category_id: c })));
    await queryInterface.bulkInsert('product_categories', links);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('product_categories', null, {});
    await queryInterface.bulkDelete('product_options', null, {});
    await queryInterface.bulkDelete('product_images', null, {});
    await queryInterface.bulkDelete('products', null, {});
    await queryInterface.bulkDelete('categories', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
