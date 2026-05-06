# Ordre des scripts Supabase

Pour relancer la base proprement, execute les fichiers SQL dans cet ordre depuis le SQL editor Supabase.

1. `schema.sql`
   - Cree les tables, vues, index, RLS, le compte admin de base et les fonctions centrales.
2. `admin_roles_clients.sql`
   - A lancer apres `schema.sql`, surtout si la base existait deja. Il remet le modele admin unique et ajoute les champs clients manquants.
3. `admin_api.sql`
   - Ajoute les RPC utilisees par les pages admin: clients, produits, paniers en attente et commandes.
4. `seed_products_rdc_cdf.sql`
   - Seed recommande pour les produits en CDF. Il vide puis recree `public.products`.

`seed_products_rdc.sql` est l'ancien seed avec des prix courts. Ne le lance pas avec `seed_products_rdc_cdf.sql`, parce que les deux remplissent les memes produits et le seed CDF doit rester le dernier.

Compte admin cree par les scripts:

- Email: `admin@restaurant.com`
- Mot de passe: `admin123`
