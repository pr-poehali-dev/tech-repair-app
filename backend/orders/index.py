"""Заявки: список, создание, обновление — ?id=, ?action=status"""
import json
import os
import psycopg2

SCHEMA = 't_p18818533_tech_repair_app'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
}

STATUS_TRANSITIONS = {
    'admin': {'new': ['accepted', 'cancelled'], 'accepted': ['in_progress', 'cancelled'], 'in_progress': ['done', 'cancelled'], 'done': [], 'cancelled': []},
    'master': {'new': ['accepted'], 'accepted': ['in_progress'], 'in_progress': ['done'], 'done': [], 'cancelled': []},
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


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


def row_to_order(row) -> dict:
    return {
        'id': row[0], 'client_name': row[1], 'client_phone': row[2],
        'address': row[3], 'work_type': row[4], 'description': row[5],
        'master_id': row[6], 'master_name': row[7],
        'status': row[8],
        'scheduled_at': row[9].isoformat() if row[9] else None,
        'prepaid': float(row[10] or 0),
        'parts_cost': float(row[11] or 0),
        'final_amount': float(row[12] or 0),
        'master_notes': row[13],
        'created_at': row[14].isoformat(),
        'updated_at': row[15].isoformat(),
    }


ORDER_SELECT = f"SELECT o.id,o.client_name,o.client_phone,o.address,o.work_type,o.description,o.master_id,u.name,o.status,o.scheduled_at,o.prepaid,o.parts_cost,o.final_amount,o.master_notes,o.created_at,o.updated_at FROM {SCHEMA}.orders o LEFT JOIN {SCHEMA}.users u ON u.id=o.master_id"


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    headers = event.get('headers') or {}
    session_id = headers.get('x-session-id') or headers.get('X-Session-Id', '')
    qs = event.get('queryStringParameters') or {}
    order_id = qs.get('id')
    action = qs.get('action')

    conn = get_conn()
    user = get_user(conn, session_id)
    if not user:
        conn.close()
        return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Unauthorized'})}

    # GET list
    if method == 'GET' and not order_id:
        cur = conn.cursor()
        if user['role'] == 'master':
            cur.execute(ORDER_SELECT + f" WHERE o.master_id=%s ORDER BY o.updated_at DESC", (user['id'],))
        else:
            cur.execute(ORDER_SELECT + " ORDER BY o.updated_at DESC")
        rows = cur.fetchall()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'orders': [row_to_order(r) for r in rows]})}

    # GET single
    if method == 'GET' and order_id:
        cur = conn.cursor()
        cur.execute(ORDER_SELECT + f" WHERE o.id=%s", (int(order_id),))
        row = cur.fetchone()
        conn.close()
        if not row:
            return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'order': row_to_order(row)})}

    # POST — create
    if method == 'POST':
        if user['role'] != 'admin':
            conn.close()
            return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Forbidden'})}
        body = json.loads(event.get('body') or '{}')
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.orders (client_name,client_phone,address,work_type,description,master_id,scheduled_at,prepaid,created_by) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
            (body['client_name'], body['client_phone'], body['address'], body['work_type'],
             body.get('description'), body.get('master_id'), body.get('scheduled_at'),
             body.get('prepaid', 0), user['id'])
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.execute(ORDER_SELECT + " WHERE o.id=%s", (new_id,))
        row = cur.fetchone()
        conn.close()
        return {'statusCode': 201, 'headers': CORS, 'body': json.dumps({'order': row_to_order(row)})}

    # PUT ?id=X&action=status — change status
    if method == 'PUT' and order_id and action == 'status':
        body = json.loads(event.get('body') or '{}')
        new_status = body.get('status')
        cur = conn.cursor()
        cur.execute(f"SELECT status, master_id FROM {SCHEMA}.orders WHERE id=%s", (int(order_id),))
        row = cur.fetchone()
        if not row:
            conn.close()
            return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}
        current_status, master_id = row
        allowed = STATUS_TRANSITIONS.get(user['role'], {}).get(current_status, [])
        if new_status not in allowed:
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': f'Нельзя перевести из {current_status} в {new_status}'})}
        if user['role'] == 'master' and master_id != user['id']:
            conn.close()
            return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Forbidden'})}
        cur.execute(f"UPDATE {SCHEMA}.orders SET status=%s, updated_at=NOW() WHERE id=%s", (new_status, int(order_id)))
        conn.commit()
        cur.execute(ORDER_SELECT + " WHERE o.id=%s", (int(order_id),))
        updated = cur.fetchone()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'order': row_to_order(updated)})}

    # PUT ?id=X — update fields
    if method == 'PUT' and order_id:
        body = json.loads(event.get('body') or '{}')
        cur = conn.cursor()
        cur.execute(f"SELECT master_id FROM {SCHEMA}.orders WHERE id=%s", (int(order_id),))
        row = cur.fetchone()
        if not row:
            conn.close()
            return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}
        master_id = row[0]
        if user['role'] == 'master' and master_id != user['id']:
            conn.close()
            return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Forbidden'})}
        fields = []
        vals = []
        for f in ['prepaid', 'parts_cost', 'final_amount', 'master_notes', 'client_name', 'client_phone', 'address', 'work_type', 'description', 'master_id', 'scheduled_at']:
            if f in body:
                fields.append(f"{f}=%s")
                vals.append(body[f])
        if not fields:
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Nothing to update'})}
        fields.append("updated_at=NOW()")
        vals.append(int(order_id))
        cur.execute(f"UPDATE {SCHEMA}.orders SET {', '.join(fields)} WHERE id=%s", vals)
        conn.commit()
        cur.execute(ORDER_SELECT + " WHERE o.id=%s", (int(order_id),))
        updated = cur.fetchone()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'order': row_to_order(updated)})}

    conn.close()
    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}
