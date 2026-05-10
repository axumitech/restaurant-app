-- Premium Délice - produits en CDF avec nouvelles catégories corrigées
-- Condiments = vivres frais / viandes / poissons
-- Accompagnements = féculents et accompagnements
-- Légumes = plats de légumes

delete from public.products;

insert into public.products (name, price, category, image_url, available) values

  -- CONDIMENTS
  ('Poulet braisé', 25000, 'condiments', 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&q=80&auto=format', true),
  ('Poulet mayo', 28000, 'condiments', 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80&auto=format', true),
  ('Capitaine braisé', 35000, 'condiments', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80&auto=format', true),
  ('Tilapia frit', 30000, 'condiments', 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&q=80&auto=format', true),
  ('Chinchard', 18000, 'condiments', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80&auto=format', true),
  ('Makayabu', 22000, 'condiments', 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&q=80&auto=format', true),
  ('Viande de chèvre', 32000, 'condiments', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80&auto=format', true),
  ('Boeuf sauce tomate', 24000, 'condiments', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80&auto=format', true),

  -- ACCOMPAGNEMENTS
  ('Riz blanc', 4000, 'accompagnements', 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80&auto=format', true),
  ('Fufu', 3000, 'accompagnements', 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80&auto=format', true),
  ('Banane plantain', 5000, 'accompagnements', 'https://images.unsplash.com/photo-1603052875302-d376b7c0638a?w=800&q=80&auto=format', true),
  ('Spaghettis', 5000, 'accompagnements', 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80&auto=format', true),
  ('Chikwangue', 2500, 'accompagnements', 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&q=80&auto=format', true),
  ('Lituma', 5000, 'accompagnements', 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&q=80&auto=format', true),
  ('Frites', 6000, 'accompagnements', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&q=80&auto=format', true),

  -- LEGUMES
  ('Pondu', 12000, 'legumes', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80&auto=format', true),
  ('Fumbwa', 14000, 'legumes', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80&auto=format', true),
  ('Madesu', 10000, 'legumes', 'https://images.unsplash.com/photo-1563599175592-c58dc214deff?w=800&q=80&auto=format', true),
  ('Ndunda', 12000, 'legumes', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80&auto=format', true),
  ('Matembele', 11000, 'legumes', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80&auto=format', true),

  -- PETIT DEJEUNER
  ('Mikate', 3000, 'petit_dejeuner', 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=800&q=80&auto=format', true),
  ('Beignets', 3000, 'petit_dejeuner', 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80&auto=format', true),
  ('Omelette', 6000, 'petit_dejeuner', 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80&auto=format', true),
  ('Café au lait', 4000, 'petit_dejeuner', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80&auto=format', true),

  -- BOISSONS
  ('Eau minérale', 2000, 'boissons', 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&q=80&auto=format', true),
  ('Jus naturel', 5000, 'boissons', 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&q=80&auto=format', true),
  ('Malta', 4000, 'boissons', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80&auto=format', true),
  ('Coca-Cola', 3000, 'boissons', 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&q=80&auto=format', true),
  ('Fanta', 3000, 'boissons', 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=800&q=80&auto=format', true),
  ('Sprite', 3000, 'boissons', 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=800&q=80&auto=format', true);