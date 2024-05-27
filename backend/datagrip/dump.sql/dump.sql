-- Table: public.Player

DROP TABLE IF EXISTS public."Player";

CREATE TABLE IF NOT EXISTS public."Player"
(
    id integer NOT NULL,
    nickname character varying COLLATE pg_catalog."default" NOT NULL,
    email character varying COLLATE pg_catalog."default" NOT NULL,
    password character varying COLLATE pg_catalog."default"
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Player"
    OWNER to postgres;

