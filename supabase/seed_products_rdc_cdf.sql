```sql
-- Premium Délice - produits en CDF avec catégories corrigées
-- Condiments = vivres frais / viandes / poissons
-- Accompagnements = féculents et accompagnements
-- Légumes = plats de légumes
-- Boissons = sodas et eaux

delete from public.products;

insert into public.products (
  name,
  price,
  category,
  image_url,
  available
) values

  -- CONDIMENTS
  ('Cuisse', 6000, 'condiments', 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80&auto=format', true),
  ('1/4 poulet', 6500, 'condiments', 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&q=80&auto=format', true),
  ('Cotis fumé', 7000, 'condiments', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80&auto=format', true),
  ('Viande', 6500, 'condiments', 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80&auto=format', true),
  ('Jarret fumé', 6000, 'condiments', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80&auto=format', true),
  ('Dindon', 5000, 'condiments', 'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=800&q=80&auto=format', true),
  ('Ailes de poulet', 5000, 'condiments', 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800&q=80&auto=format', true),
  ('Thomson 25+', 13000, 'condiments', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80&auto=format', true),
  ('Thomson 20+', 6500, 'condiments', 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&q=80&auto=format', true),
  ('Makayabu', 4000, 'condiments', 'https://images.unsplash.com/photo-1534766438357-2b270dbd1b40?w=800&q=80&auto=format', true),
  ('Ngolo', 15000, 'condiments', 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=800&q=80&auto=format', true),
  ('Malua', 7000, 'condiments', 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80&auto=format', true),
  ('3 pièces', 6000, 'condiments', 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&q=80&auto=format', true),

  -- ACCOMPAGNEMENTS
  ('Spaghetti', 7000, 'accompagnements', 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80&auto=format', true),
  ('Kwanga', 1500, 'accompagnements', 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&q=80&auto=format', true),
  ('Fufu', 1000, 'accompagnements', 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80&auto=format', true),
  ('Riz', 4000, 'accompagnements', 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80&auto=format', true),
  ('Riz gras', 8000, 'accompagnements', '/images/products/riz-gras.jpg', true),
  ('Plantain', 4000, 'accompagnements', 'https://images.unsplash.com/photo-1603052875302-d376b7c0638a?w=800&q=80&auto=format', true),

  -- LÉGUMES
  ('Haricot', 4000, 'legumes', 'https://images.unsplash.com/photo-1563599175592-c58dc214deff?w=800&q=80&auto=format', true),
  ('Pondu', 3000, 'legumes', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80&auto=format', true),
  ('Nsakamadesu', 4000, 'legumes', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80&auto=format', true),
  ('Épinards', 8000, 'legumes', 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&q=80&auto=format', true),
  ('Matembele', 4000, 'legumes', 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?w=800&q=80&auto=format', true),
  ('Fumbwa', 5000, 'legumes', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80&auto=format', true),
  ('Gombo', 4000, 'legumes', 'https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=800&q=80&auto=format', true),
  ('Ngai-ngai', 3000, 'legumes', 'https://images.unsplash.com/photo-1506806732259-39c2d0268443?w=800&q=80&auto=format', true),

  -- BOISSONS
  ('Petit Coca', 2500, 'boissons', '/images/products/petit-coca.jpg', true),
  ('Grand Coca', 3000, 'boissons', '/images/products/grand-coca.jpg', true),
  ('Petit Fanta', 2500, 'boissons', '/images/products/petit-fanta.jpg', true),
  ('Grand Fanta', 3000, 'boissons', '/images/products/grand-fanta.jpg', true),
  ('Eau', 1000, 'boissons', '/images/products/eau.jpg', true),
  ('Petite eau', 500, 'boissons', '/images/products/petite-eau.jpg', true);
```
