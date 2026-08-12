alter table floors
add column is_active boolean default true;

alter table spaces
add column is_active boolean default true;
