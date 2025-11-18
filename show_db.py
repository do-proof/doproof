import sqlite3
import json

conn = sqlite3.connect('backend/doproof.db')
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()

print("=" * 80)
print("DATABASE STRUCTURE")
print("=" * 80)

for table in tables:
    table_name = table[0]
    print(f"\n📊 Table: {table_name}")
    print("-" * 80)
    
    # Get table schema
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = cursor.fetchall()
    
    print("\nColumns:")
    for col in columns:
        col_id, name, col_type, not_null, default, pk = col
        pk_str = " [PRIMARY KEY]" if pk else ""
        null_str = " NOT NULL" if not_null else ""
        default_str = f" DEFAULT {default}" if default else ""
        print(f"  - {name}: {col_type}{pk_str}{null_str}{default_str}")
    
    # Get row count
    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    count = cursor.fetchone()[0]
    print(f"\nRow count: {count}")
    
    # Show sample data (first 5 rows)
    if count > 0:
        cursor.execute(f"SELECT * FROM {table_name} LIMIT 5")
        rows = cursor.fetchall()
        col_names = [desc[0] for desc in cursor.description]
        
        print(f"\nSample data (first {min(count, 5)} rows):")
        for i, row in enumerate(rows, 1):
            print(f"\n  Row {i}:")
            for col_name, value in zip(col_names, row):
                # Truncate long values
                if isinstance(value, str) and len(value) > 100:
                    value = value[:100] + "..."
                print(f"    {col_name}: {value}")

conn.close()
print("\n" + "=" * 80)
