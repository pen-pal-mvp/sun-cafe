SET local check_function_bodies = off;

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "service_role";

CREATE EXTENSION "pg_cron";

CREATE TABLE "public"."blocks" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "blocker_id" uuid                     NOT NULL,
  "blocked_id" uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "blocks_blocker_id_blocked_id_key" UNIQUE (blocker_id, blocked_id),
  CONSTRAINT "blocks_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."blocks"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."letters" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "sender_id"   uuid                     NOT NULL,
  "receiver_id" uuid                     NOT NULL,
  "content"     text                     NOT NULL,
  "ai_assisted" boolean                  DEFAULT false,
  "created_at"  timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "letters_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."letters"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."profiles" (
  "id"                 uuid                     NOT NULL,
  "email"              text                     NOT NULL,
  "nickname"           text,
  "is_paid"            boolean                  DEFAULT false,
  "stripe_customer_id" text,
  "created_at"         timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "bio"                text,
  "native_language"    text,
  "learning_language"  text,
  "mbti"               text,
  "is_deleted"         boolean                  DEFAULT false,
  "updated_at"         timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.delete_old_letters()
  RETURNS void
  LANGUAGE plpgsql
  AS $function$
BEGIN
  -- 作成日(created_at)が現在より300日以上前のデータを削除
  DELETE FROM public.letters
  WHERE created_at < NOW() - INTERVAL '300 days';
END;
$function$;

REVOKE ALL ON FUNCTION "public"."delete_old_letters"() FROM "anon", "authenticated", "service_role";

CREATE OR REPLACE FUNCTION public.handle_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION "public"."handle_updated_at"() FROM "anon", "authenticated", "service_role";

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."blocks"
  ADD CONSTRAINT "blocks_blocked_id_fkey" FOREIGN KEY (blocked_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."blocks"
  ADD CONSTRAINT "blocks_blocker_id_fkey" FOREIGN KEY (blocker_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."letters"
  ADD CONSTRAINT "letters_receiver_id_fkey" FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."letters"
  ADD CONSTRAINT "letters_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE POLICY "Users can insert their own blocks" ON "public"."blocks"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = blocker_id));

CREATE POLICY "Users can read their own blocks" ON "public"."blocks"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = blocker_id));

CREATE POLICY "Paid users can insert letters." ON "public"."letters"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = sender_id));

CREATE POLICY "Users can insert letters as sender" ON "public"."letters"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((auth.uid() = sender_id));

CREATE POLICY "Users can view their own letters" ON "public"."letters"
  FOR SELECT
  TO "authenticated"
  USING (((auth.uid() = sender_id) OR (auth.uid() = receiver_id)));

CREATE POLICY "Users can view their own letters." ON "public"."letters"
  FOR SELECT
  TO PUBLIC
  USING (((auth.uid() = sender_id) OR (auth.uid() = receiver_id)));

CREATE POLICY "Allow ALL operations" ON "public"."profiles"
  FOR ALL
  TO PUBLIC
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Profiles are viewable by everyone." ON "public"."profiles"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Users can update own profile." ON "public"."profiles"
  FOR UPDATE
  TO PUBLIC
  USING ((auth.uid() = id));

COMMENT ON EXTENSION "pg_cron" IS 'Job scheduler for PostgreSQL';

GRANT EXECUTE ON FUNCTION "public"."delete_old_letters"() TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."delete_old_letters"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."delete_old_letters"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_updated_at"() TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."handle_updated_at"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_updated_at"() TO "postgres";

REVOKE ALL ON TABLE "public"."blocks" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."blocks" TO "anon";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."blocks" TO "authenticated";

REVOKE ALL ON TABLE "public"."blocks" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."blocks" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."blocks" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."letters" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."letters" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."letters" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."letters" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."profiles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "service_role";

SELECT cron.schedule_in_database('delete-old-letters-job', '0 0 * * *', '
    delete from letters
    where created_at < now() - interval ''300 days'';
  ', 'postgres', NULL, true);

