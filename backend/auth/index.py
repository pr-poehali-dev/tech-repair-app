"""Аутентификация: логин, логаут, получение текущего пользователя"""
import json
import os
import hashlib
import secrets
import psycopg2
from datetime import datetime

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


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    headers = event.get('headers') or {}
    session_id = headers.get('x-session-id') or headers.get('X-Session-Id', '')

    # POST /login
    if method == 'POST' and path.endswith('/login'):
        body = json.loads(event.get('body') or '{}')
        email = body.get('email', '').strip().lower()
        password = body.get('password', '')
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, name, email, role, phone, speciality, rating FROM {SCHEMA}.users WHERE email=%s AND password_hash=%s AND is_active=true",
            (email, md5(password))
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Неверный email или пароль'})}
        user = {'id': row[0], 'name': row[1], 'email': row[2], 'role': row[3], 'phone': row[4], 'speciality': row[5], 'rating': float(row[6] or 5)}
        sid = secrets.token_hex(32)
        cur.execute(f"INSERT INTO {SCHEMA}.sessions (id, user_id) VALUES (%s, %s)", (sid, user['id']))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'session_id': sid, 'user': user})}

    # POST /logout
    if method == 'POST' and path.endswith('/logout'):
        if session_id:
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at=NOW() WHERE id=%s", (session_id,))
            conn.commit()
            conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    # GET /me
    if method == 'GET' and path.endswith('/me'):
        if not session_id:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'No session'})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT u.id, u.name, u.email, u.role, u.phone, u.speciality, u.rating FROM {SCHEMA}.users u JOIN {SCHEMA}.sessions s ON s.user_id=u.id WHERE s.id=%s AND s.expires_at>NOW()",
            (session_id,)
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Session expired'})}
        user = {'id': row[0], 'name': row[1], 'email': row[2], 'role': row[3], 'phone': row[4], 'speciality': row[5], 'rating': float(row[6] or 5)}
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user})}

    # PUT /profile — update own profile
    if method == 'PUT' and path.endswith('/profile'):
        if not session_id:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'No session'})}
        body = json.loads(event.get('body') or '{}')
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT user_id FROM {SCHEMA}.sessions WHERE id=%s AND expires_at>NOW()", (session_id,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Session expired'})}
        uid = row[0]
        name = body.get('name')
        email = body.get('email')
        phone = body.get('phone')
        if name:
            cur.execute(f"UPDATE {SCHEMA}.users SET name=%s WHERE id=%s", (name, uid))
        if email:
            cur.execute(f"UPDATE {SCHEMA}.users SET email=%s WHERE id=%s", (email, uid))
        if phone:
            cur.execute(f"UPDATE {SCHEMA}.users SET phone=%s WHERE id=%s", (phone, uid))
        conn.commit()
        cur.execute(f"SELECT id, name, email, role, phone, speciality, rating FROM {SCHEMA}.users WHERE id=%s", (uid,))
        r = cur.fetchone()
        conn.close()
        user = {'id': r[0], 'name': r[1], 'email': r[2], 'role': r[3], 'phone': r[4], 'speciality': r[5], 'rating': float(r[6] or 5)}
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user})}

    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}
