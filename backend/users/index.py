"""Управление пользователями: список, добавление, обновление роли/данных (только admin)"""
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


def row_to_user(row) -> dict:
    return {
        'id': row[0], 'name': row[1], 'email': row[2],
        'phone': row[3], 'role': row[4], 'speciality': row[5],
        'rating': float(row[6] or 5), 'is_active': row[7],
        'created_at': row[8].isoformat(),
    }


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    headers = event.get('headers') or {}
    session_id = headers.get('x-session-id') or headers.get('X-Session-Id', '')

    conn = get_conn()
    user = get_user(conn, session_id)
    if not user:
        conn.close()
        return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Unauthorized'})}

    parts = [p for p in path.split('/') if p]
    target_id = None
    if len(parts) >= 1 and parts[-1].isdigit():
        target_id = int(parts[-1])

    # GET /users — list masters (admin only)
    if method == 'GET' and target_id is None:
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, name, email, phone, role, speciality, rating, is_active, created_at FROM {SCHEMA}.users ORDER BY role, name"
        )
        rows = cur.fetchall()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'users': [row_to_user(r) for r in rows]})}

    # POST /users — create master (admin only)
    if method == 'POST' and target_id is None:
        if user['role'] != 'admin':
            conn.close()
            return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Forbidden'})}
        body = json.loads(event.get('body') or '{}')
        password = body.get('password', 'master123')
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.users (name, email, phone, role, password_hash, speciality) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id, name, email, phone, role, speciality, rating, is_active, created_at",
            (body['name'], body['email'], body.get('phone'), body.get('role', 'master'), md5(password), body.get('speciality'))
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return {'statusCode': 201, 'headers': CORS, 'body': json.dumps({'user': row_to_user(row)})}

    # PUT /users/:id — update user (admin only)
    if method == 'PUT' and target_id:
        if user['role'] != 'admin':
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
        if 'password' in body:
            fields.append("password_hash=%s")
            vals.append(md5(body['password']))
        if not fields:
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Nothing to update'})}
        vals.append(target_id)
        cur.execute(f"UPDATE {SCHEMA}.users SET {', '.join(fields)} WHERE id=%s RETURNING id, name, email, phone, role, speciality, rating, is_active, created_at", vals)
        row = cur.fetchone()
        conn.commit()
        conn.close()
        if not row:
            return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': row_to_user(row)})}

    conn.close()
    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}
