"""Загрузка и получение файлов заявки (чеки, документы)"""
import json
import os
import base64
import uuid
import boto3
import psycopg2

SCHEMA = 't_p18818533_tech_repair_app'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_s3():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )


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


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    headers = event.get('headers') or {}
    session_id = headers.get('x-session-id') or headers.get('X-Session-Id', '')
    qs = event.get('queryStringParameters') or {}

    conn = get_conn()
    user = get_user(conn, session_id)
    if not user:
        conn.close()
        return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Unauthorized'})}

    # GET /files?order_id=X
    if method == 'GET':
        order_id = qs.get('order_id')
        if not order_id:
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'order_id required'})}
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, filename, s3_key, file_url, file_type, uploaded_by, created_at FROM {SCHEMA}.order_files WHERE order_id=%s ORDER BY created_at DESC",
            (int(order_id),)
        )
        rows = cur.fetchall()
        conn.close()
        files = [{'id': r[0], 'filename': r[1], 's3_key': r[2], 'file_url': r[3], 'file_type': r[4], 'uploaded_by': r[5], 'created_at': r[6].isoformat()} for r in rows]
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'files': files})}

    # POST /files — upload file
    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        order_id = body.get('order_id')
        filename = body.get('filename', 'file')
        file_type = body.get('file_type', 'receipt')
        data_b64 = body.get('data')
        content_type = body.get('content_type', 'application/octet-stream')

        if not order_id or not data_b64:
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'order_id and data required'})}

        file_data = base64.b64decode(data_b64)
        ext = filename.rsplit('.', 1)[-1] if '.' in filename else 'bin'
        key = f"orders/{order_id}/{uuid.uuid4().hex}.{ext}"
        s3 = get_s3()
        s3.put_object(Bucket='files', Key=key, Body=file_data, ContentType=content_type)
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.order_files (order_id, filename, s3_key, file_url, file_type, uploaded_by) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id",
            (order_id, filename, key, cdn_url, file_type, user['id'])
        )
        file_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {'statusCode': 201, 'headers': CORS, 'body': json.dumps({'file': {'id': file_id, 'filename': filename, 'file_url': cdn_url, 'file_type': file_type}})}

    conn.close()
    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}
