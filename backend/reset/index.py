"""Сброс данных: удаление всех заявок и файлов (только admin)"""
import json
import os
import psycopg2

SCHEMA = 't_p18818533_tech_repair_app'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    headers = event.get('headers') or {}
    session_id = headers.get('x-session-id') or headers.get('X-Session-Id', '')
    qs = event.get('queryStringParameters') or {}
    action = qs.get('action', '')

    conn = get_conn()
    cur = conn.cursor()

    # Auth check
    cur.execute(
        f"SELECT u.id, u.role FROM {SCHEMA}.users u JOIN {SCHEMA}.sessions s ON s.user_id=u.id WHERE s.id=%s AND s.expires_at>NOW()",
        (session_id,)
    )
    row = cur.fetchone()
    if not row or row[1] != 'admin':
        conn.close()
        return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Forbidden'})}

    # POST ?action=orders — delete all orders + files
    if method == 'POST' and action == 'orders':
        cur.execute(f"DELETE FROM {SCHEMA}.order_files")
        cur.execute(f"DELETE FROM {SCHEMA}.orders")
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, 'cleared': 'orders'})}

    # POST ?action=deactivate_master&id=X — deactivate master + kill sessions
    if method == 'POST' and action == 'deactivate_master':
        master_id = qs.get('id')
        if not master_id:
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'id required'})}
        cur.execute(f"UPDATE {SCHEMA}.users SET is_active=false WHERE id=%s AND role='master'", (int(master_id),))
        cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at=NOW() WHERE user_id=%s", (int(master_id),))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    conn.close()
    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}
