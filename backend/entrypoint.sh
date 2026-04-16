#!/bin/sh

echo "Waiting for database to be ready..."

while ! python -c "
import psycopg2
try:
    conn = psycopg2.connect(
        host='db',
        port=5432,
        user='$POSTGRES_USER',
        password='$POSTGRES_PASSWORD',
        database='$POSTGRES_DB'
    )
    conn.close()
    print('Database is ready')
except Exception as e:
    print(f'Database not ready: {e}')
    exit(1)
"; do
    echo "Database not ready, waiting..."
    sleep 2
done

echo "Database is ready, creating super admin..."

echo "Applying idempotent SQL migrations..."
python -c "
import psycopg2
from pathlib import Path

migration_path = Path('/app/migrations/add_agent_as_api_fields.sql')
if migration_path.exists():
    with migration_path.open('r', encoding='utf-8') as f:
        sql = f.read()

    conn = psycopg2.connect(
        host='db',
        port=5432,
        user='$POSTGRES_USER',
        password='$POSTGRES_PASSWORD',
        database='$POSTGRES_DB'
    )
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.close()
    print('Migrations applied successfully')
else:
    print('Migration file not found, skipping migration step')
"

python app/database/create_super_admin.py

echo "Starting FastAPI server..."

exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload