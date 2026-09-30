begin;

create index if not exists equipes_responsavel_registro
  on public.registro_equipes(responsavel_id, registro_frota_id);

-- Same visibility as History: employees see their entries; admins see all.
-- Only saved allocations count. Exclude the current entry when editing.
create function public.ultimo_veiculo_motorista(p_token text, p_motorista_id bigint, p_excluir_registro uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_uid uuid := private.validar_sessao(p_token);
  v_admin boolean := public.e_admin();
  v_result jsonb;
begin
  select case when v.ativo then jsonb_build_object('vehicleId',v.id,'date',r.data) else null end
  into v_result
  from public.registro_equipes e
  join public.registros_frota r on r.id=e.registro_frota_id
  join public.veiculos v on v.id=e.veiculo_id
  join public.funcionarios f on f.id=e.responsavel_id
  where e.responsavel_id=p_motorista_id and f.ativo and not f.is_status
    and (p_excluir_registro is null or r.id<>p_excluir_registro)
    and (r.usuario_id=v_uid or v_admin)
  order by r.data desc,r.created_at desc,r.id desc,e.numero_equipe desc
  limit 1;
  return v_result;
end;
$$;
revoke all on function public.ultimo_veiculo_motorista(text,bigint,uuid) from public,authenticated,service_role;
grant execute on function public.ultimo_veiculo_motorista(text,bigint,uuid) to anon;
notify pgrst, 'reload schema';
commit;
