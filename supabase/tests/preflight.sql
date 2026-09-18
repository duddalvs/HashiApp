select n.nspname as esquema, c.relname as tabela, c.relrowsecurity as rls
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r'
order by c.relname;
