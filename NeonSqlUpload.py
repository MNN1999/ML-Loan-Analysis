import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

# Load .env file that contains the database URL as an environment variable
load_dotenv("dburl.env")
# os.environ is a dictionary that contains all the environment variables, so we can access the database URL (a string variable) using its key
connection_string = os.environ["database_url"]

# Create a SQLAlchemy engine using the connection string to connect to project database at NeonDB
engine = create_engine(connection_string)

# Read CSV file into a pandas DataFrame
df = pd.read_csv("data/loan.csv")
# Upload DataFrame to NeonDB using name,
# engine(of connection link),
# if_exists to replace, if file runs again.
df.to_sql("loan_data", engine, if_exists="replace", index=False)

# Obtains shape (rows, columns) and gets row count using [0]
df_row = df.shape[0]

# SQL query to count rows in the NeonDB table
row_query = text(
    """
SELECT COUNT(*)
FROM loan_data
"""
)

# Execute the SQL query and fetch the row count from NeonDB
# Using scalar_one() to get single value result instead of a tuple (row_count,)
with engine.connect() as connection:
    neon_row = connection.execute(row_query).scalar_one()


# Compare row counts from DataFrame and NeonDB
if neon_row == df_row:
    print(f"Upload successful: {neon_row} = {df_row}. Row counts match.")
else:
    print(f"Upload Error: local={df_row}, neon={neon_row}. Row counts do not match.")
