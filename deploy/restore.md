# Restoring a PedagogIA Postgres backup

Backups are encrypted with [age](https://age-encryption.org) and live on the Hetzner Storage Box `pedagogia-backups` (`u578869.your-storagebox.de`, location `fsn1`). Three buckets: `daily/` (7 kept), `weekly/` (4), `monthly/` (3). See `.env.prod` on the VPS for connection env; private age key lives only in 1Password ("collegia — storage box + backup keys").

## 1. Pick and download a dump

From your laptop (any Mac/Linux with SSH + age):

```bash
# List what's available
sftp -i ~/.ssh/id_ed25519 -P 23 u578869@u578869.your-storagebox.de <<<"ls -1 daily"

# Download the one you want
sftp -i ~/.ssh/id_ed25519 -P 23 u578869@u578869.your-storagebox.de:daily/pedagogia-20260418T030000Z.dump.age .
```

## 2. Decrypt

```bash
# Put the private key file somewhere temporary (600 perms)
echo "AGE-SECRET-KEY-1…" > /tmp/age_key.txt && chmod 600 /tmp/age_key.txt

age -d -i /tmp/age_key.txt -o pedagogia.dump pedagogia-20260418T030000Z.dump.age
rm /tmp/age_key.txt
```

## 3. Restore into a fresh Postgres

### Option A — restore into the live prod stack (in place)

Only if the DB is already broken or empty. **This overwrites data.** Stop the backend first so no writes race the restore.

```bash
scp pedagogia.dump pedagogia@46.225.142.212:/tmp/
ssh pedagogia@46.225.142.212
cd /opt/pedagogia
docker compose -f docker-compose.prod.yml stop backend
docker compose -f docker-compose.prod.yml exec -T db \
  pg_restore -U pedagogia -d pedagogia --clean --if-exists < /tmp/pedagogia.dump
docker compose -f docker-compose.prod.yml start backend
rm /tmp/pedagogia.dump
```

### Option B — restore into a fresh disposable container (verification)

Use this for the quarterly dry-run. Run locally on your laptop:

```bash
docker run -d --name pg-restore-test \
  -e POSTGRES_USER=pedagogia -e POSTGRES_PASSWORD=pedagogia -e POSTGRES_DB=pedagogia \
  -p 55432:5432 postgres:16-alpine

# wait for pg to be ready
until docker exec pg-restore-test pg_isready -U pedagogia; do sleep 1; done

docker exec -i pg-restore-test pg_restore -U pedagogia -d pedagogia --clean --if-exists < pedagogia.dump

# sanity: how many students/skills/attempts came back
docker exec pg-restore-test psql -U pedagogia -d pedagogia -c \
  "SELECT 'students' t, count(*) FROM students_student
   UNION ALL SELECT 'skills', count(*) FROM skills_skill
   UNION ALL SELECT 'attempts', count(*) FROM exercises_attempt;"

docker rm -f pg-restore-test
```

## 4. Verification checklist after a real restore

- [ ] Backend container is healthy (`docker compose ps`)
- [ ] `curl https://collegia.be/api/health/` returns 200
- [ ] Log in as the operator user and see your children on `/enfants`
- [ ] Open a child, confirm skill tree loads and mastery state looks right
- [ ] Attempt one exercise; no 500s in `docker logs pedagogia-backend-1 --tail 50`

## 5. Incident note

After any real restore (not a dry-run), append a short entry to
`vault/wiki/log.md` (`## [YYYY-MM-DD] note | restored prod DB from <filename>`)
so the next operator has the timeline.
