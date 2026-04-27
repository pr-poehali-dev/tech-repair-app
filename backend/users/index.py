"""Управление пользователями: ?id= для конкретного, без id — список"""
import json
import os
import hashlib
import psycopg2

SCHEMA = 't_p18818533_tech_repair_app'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def md5(s: str) -> str:
    return hashlib.md5(s.encode()).hexdigest()


def get_user(conn, session_id: str):
    cur = conn.cursor()
    cur.execute(
        f"SELECT u.id, u.name, u.role FROM {SCHEMA}.users u JOIN {SCHEMA}.sessions s ON s.user_id=u.id WHERE s.id=%s AND s.expires_at>NOW()",
        (session_id,)
    )
    row = cur.fetchone()
    if not row:
        return None
    return {'id': row[0], 'name': row[1], 'role': row[2]}


def row_to_user(row, include_password=False) -> dict:
    result = {
        'id': row[0], 'name': row[1], 'email': row[2],
        'phone': row[3], 'role': row[4], 'speciality': row[5],
        'rating': float(row[6] or 5), 'is_active': row[7],
        'created_at': row[8].isoformat(),
    }
    if include_password:
        result['plain_password'] = row[9] or ''
    return result


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    headers = event.get('headers') or {}
    session_id = headers.get('x-session-id') or headers.get('X-Session-Id', '')
    qs = event.get('queryStringParameters') or {}
    target_id = qs.get('id')

    conn = get_conn()
    user = get_user(conn, session_id)
    if not user:
        conn.close()
        return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Unauthorized'})}

    is_admin = user['role'] == 'admin'

    # GET — list
    if method == 'GET' and not target_id:
        cur = conn.cursor()
        cur.execute(f"SELECT id, name, email, phone, role, speciality, rating, is_active, created_at, plain_password FROM {SCHEMA}.users ORDER BY role, name")
        rows = cur.fetchall()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'users': [row_to_user(r, include_password=is_admin) for r in rows]})}

    # POST — create (admin only)
    if method == 'POST':
        if not is_admin:
            conn.close()
            return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Forbidden'})}
        body = json.loads(event.get('body') or '{}')
        password = body.get('password', 'master123')
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.users (name, email, phone, role, password_hash, speciality, plain_password) VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id, name, email, phone, role, speciality, rating, is_active, created_at, plain_password",
            (body['name'], body['email'], body.get('phone'), body.get('role', 'master'), md5(password), body.get('speciality'), password)
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return {'statusCode': 201, 'headers': CORS, 'body': json.dumps({'user': row_to_user(row, include_password=True)})}

    # PUT ?id=X — update (admin only)
    if method == 'PUT' and target_id:
        if not is_admin:
            conn.close()
            return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Forbidden'})}
        body = json.loads(event.get('body') or '{}')
        cur = conn.cursor()
        fields = []
        vals = []
        for f in ['name', 'email', 'phone', 'role', 'speciality', 'is_active']:
            if f in body:
                fields.append(f"{f}=%s")
                vals.append(body[f])
        if 'password' in body and body['password']:
            fields.append("password_hash=%s")
            vals.append(md5(body['password']))
            fields.append("plain_password=%s")
            vals.append(body['password'])
        if not fields:
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Nothing to update'})}
        vals.append(int(target_id))
        cur.execute(f"UPDATE {SCHEMA}.users SET {', '.join(fields)} WHERE id=%s RETURNING id, name, email, phone, role, speciality, rating, is_active, created_at, plain_password", vals)
        row = cur.fetchone()
        conn.commit()
        conn.close()
        if not row:
            return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': row_to_user(row, include_password=True)})}

    conn.close()
    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}
