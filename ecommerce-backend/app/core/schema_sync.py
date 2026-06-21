from sqlalchemy import inspect, text
from sqlalchemy.engine import Connection
from sqlalchemy.schema import CreateColumn, MetaData


def sync_missing_tables_and_columns(conn: Connection, metadata: MetaData) -> None:
    """同步数据库结构。

    当前策略：
    1. 自动创建缺失的数据表。
    2. 自动给已存在的表补齐缺失字段。
    3. 不处理字段改类型、删字段、改索引这类高风险操作。
    """
    metadata.create_all(bind=conn)

    inspector = inspect(conn)
    existing_tables = set(inspector.get_table_names())
    preparer = conn.dialect.identifier_preparer
    added_columns: list[str] = []

    for table in metadata.sorted_tables:
        if table.name not in existing_tables:
            continue

        existing_columns = {
            column_info["name"]
            for column_info in inspector.get_columns(table.name)
        }

        for column in table.columns:
            if column.name in existing_columns:
                continue

            column_sql = str(
                CreateColumn(column).compile(dialect=conn.dialect)
            ).strip()
            table_name = preparer.quote_identifier(table.name)
            sql = f"ALTER TABLE {table_name} ADD COLUMN {column_sql}"
            conn.execute(text(sql))
            added_columns.append(f"{table.name}.{column.name}")

    if added_columns:
        print("已补齐缺失字段:", ", ".join(added_columns))
    else:
        print("未发现缺失字段")
