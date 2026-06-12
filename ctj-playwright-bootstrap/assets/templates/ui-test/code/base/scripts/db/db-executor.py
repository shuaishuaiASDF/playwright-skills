import argparse
import json
import os
import re
import sys


def parse_args():
    parser = argparse.ArgumentParser(description="通用数据库 SQL 执行器")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--sql", help="直接传入 SQL 语句（含 %s 占位符）")
    group.add_argument("--sql-file", help="SQL 文件路径（文件内容为 SQL 语句）")
    parser.add_argument(
        "--params",
        default="[]",
        help='参数列表，JSON 数组格式，如 \'["value1", "value2"]\'',
    )
    return parser.parse_args()


def read_env(*names):
    for name in names:
        value = os.getenv(name)
        if value:
            return value
    raise RuntimeError(f"缺少环境变量: {' / '.join(names)}")


def load_db_config():
    return {
        "db_type": read_env("DB_EXECUTOR_TYPE", "DB_TYPE").strip().lower(),
        "host": read_env("DB_EXECUTOR_HOST", "DB_HOST"),
        "port": read_env("DB_EXECUTOR_PORT", "DB_PORT"),
        "name": read_env("DB_EXECUTOR_NAME", "DB_NAME"),
        "user": read_env("DB_EXECUTOR_USER", "DB_USER"),
        "password": read_env("DB_EXECUTOR_PASSWORD", "DB_PASSWORD"),
    }


def mysql_connect(config):
    try:
        import pymysql
    except ImportError as exc:
        raise RuntimeError("未安装 pymysql，请先执行: pip install pymysql") from exc

    return pymysql.connect(
        host=config["host"],
        port=int(config["port"]),
        user=config["user"],
        password=config["password"],
        database=config["name"],
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        connect_timeout=10,
        read_timeout=30,
    )


def oracledb_connect(config):
    try:
        import oracledb
    except ImportError as exc:
        raise RuntimeError("未安装 oracledb，请先执行: pip install oracledb") from exc

    dsn = f"{config['host']}:{config['port']}/{config['name']}"
    return oracledb.connect(user=config["user"], password=config["password"], dsn=dsn)


def dmpython_connect(config):
    try:
        import dmPython
    except ImportError as exc:
        raise RuntimeError("未安装 dmPython，请先安装达梦 Python 驱动") from exc

    return dmPython.connect(
        user=config["user"],
        password=config["password"],
        server=config["host"],
        port=int(config["port"]),
        autoCommit=True,
    )


def get_connection(config):
    db_type = config["db_type"]
    if db_type == "mysql":
        return mysql_connect(config)
    if db_type == "oracle":
        return oracledb_connect(config)
    if db_type == "dm":
        return dmpython_connect(config)
    raise RuntimeError(f"暂不支持的数据库类型: {db_type}")


def convert_placeholders(sql, db_type):
    if db_type == "mysql":
        return sql

    counter = [0]

    def replace_match(match):
        counter[0] += 1
        return f":{counter[0]}"

    return re.sub(r"(?<!%)%s", replace_match, sql)


def lower_key_dict(row, keys):
    lowered = {}
    for index, key in enumerate(keys):
        lowered[str(key).lower()] = row[index]
    return lowered


def execute_query(connection, sql, params, db_type):
    converted_sql = convert_placeholders(sql, db_type)
    cursor = connection.cursor()
    try:
        cursor.execute(converted_sql, params)
        rows = cursor.fetchall()
        if db_type == "mysql":
            return rows
        columns = [item[0] for item in cursor.description]
        return [lower_key_dict(row, columns) for row in rows]
    finally:
        cursor.close()


def main():
    args = parse_args()
    config = load_db_config()

    if args.sql:
      sql = args.sql
    else:
      with open(args.sql_file, "r", encoding="utf-8") as f:
          sql = f.read().strip()

    try:
        params = json.loads(args.params)
    except json.JSONDecodeError as exc:
        output = {"success": False, "error": f"参数 JSON 解析失败: {exc}"}
        sys.stdout.write(json.dumps(output, ensure_ascii=False))
        sys.exit(0)

    connection = None
    try:
        connection = get_connection(config)
        rows = execute_query(connection, sql, params, config["db_type"])
        output = {"success": True, "rowCount": len(rows), "rows": rows}
        sys.stdout.write(json.dumps(output, ensure_ascii=False, default=str))
    except Exception as exc:
        output = {"success": False, "error": str(exc)}
        sys.stdout.write(json.dumps(output, ensure_ascii=False))
    finally:
        if connection is not None:
            connection.close()


if __name__ == "__main__":
    main()
