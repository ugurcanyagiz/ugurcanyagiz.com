create or replace function public.remove_duplicate_credit_rows()
returns integer
language sql
security definer
set search_path = public
as $$
  with deleted_rows as (
    delete from credit_rows
    where id in (
      select id
      from (
        select
          id,
          row_number() over (
            partition by
              customer_code,
              invoice_no,
              item_no,
              quantity,
              piece_price
            order by id
          ) as rn
        from credit_rows
      ) x
      where x.rn > 1
    )
    returning id
  )
  select count(*)::integer from deleted_rows;
$$;
