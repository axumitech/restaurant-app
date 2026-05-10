# Ordre des scripts Supabase

Pour relancer la base proprement, supprime l'ancien contenu si nécessaire puis exécute ces fichiers SQL dans cet ordre depuis le SQL editor Supabase.

1. `schema.sql`
   - Recrée les tables, relations, vues, index, RLS, le compte admin, les fonctions centrales et la validation de commande.
2. `admin_api.sql`
   - Ajoute les RPC utilisées par les pages admin: clients, comptes clients, paiements, produits, paniers en attente, commandes et lignes de commande.
3. `seed_products_rdc_cdf.sql`
   - Seed recommandé pour Premium Délice en CDF avec les catégories: Condiments, Accompagnements, Légumes, Petit déjeuner, Boissons.

`seed_products_rdc.sql` est un seed de démonstration avec des prix courts. Ne le lance pas avec `seed_products_rdc_cdf.sql`, parce que les deux vident puis remplissent `public.products`.

`admin_roles_clients.sql` est conservé seulement pour compatibilité avec l'ancien ordre d'exécution. Il n'est plus nécessaire sur une base propre.

Compte admin créé par les scripts:

- Email: `admin@restaurant.com`
- Mot de passe: `admin123`
